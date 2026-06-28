import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import Header from "./Header";
import UpgradeOverlay from "./UpgradeOverlay";
import MessagesWidget from "./MessagesWidget";
import { buildApiUrl } from "./utils/api";
import { resolveMediaUrl } from "./utils/mediaUrl";

const imageAssets = import.meta.glob("./assets/*", { eager: true, import: "default" });

const banners = [
  "./assets/banner1mcdonalds.png",
  "./assets/banner2.jpg",
];

const fallbackImage = imageAssets["./assets/gatoportada.jpg"] || "./assets/gatoportada.jpg";
const TOUR_KEY = "harawi_dashboard_tour_seen";

const getArchiveLabel = (archiveType) => (archiveType === "AUDIO" ? "Audio" : "Video");

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getArchiveDescription = (archive) => {
  if (!archive?.description) return "Sin descripcion disponible.";

  const normalized = String(archive.description).trim();
  if (normalized.length <= 120) return normalized;

  return `${normalized.slice(0, 117).trim()}...`;
};

const formatCardDate = (value) => {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const matchesSearch = (archive, searchValue) => {
  if (!searchValue.trim()) return true;

  const haystack = normalizeText(
    [
      archive?.title,
      archive?.description,
      archive?.username,
    ].filter(Boolean).join(" ")
  );

  return haystack.includes(normalizeText(searchValue));
};

const sortArchives = (archives, sortMode) => {
  const list = [...archives];

  if (sortMode === "newest") {
    return list.sort((a, b) => new Date(b.creation_date || 0) - new Date(a.creation_date || 0));
  }

  if (sortMode === "oldest") {
    return list.sort((a, b) => new Date(a.creation_date || 0) - new Date(b.creation_date || 0));
  }

  if (sortMode === "title") {
    return list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "es"));
  }

  return list;
};

function ArchiveCard({ archive }) {
  return (
    <Link to={`/video/${archive.project_id}`} className="content-card-link">
      <article className="content-card">
        <div className="card-image-container">
          <img
            src={archive.thumbnail_url ? resolveMediaUrl(archive.thumbnail_url) : fallbackImage}
            alt={archive.title || getArchiveLabel(archive.archive_type)}
            className="card-image"
          />
          <span className="card-type-badge">{getArchiveLabel(archive.archive_type)}</span>
        </div>

        <div className="card-info">
          <p className="card-meta">
            {archive.username || "Usuario desconocido"} · {formatCardDate(archive.creation_date)}
          </p>
          <h4 className="card-desc">{archive.title || "Sin titulo"}</h4>
          <p className="card-summary">{getArchiveDescription(archive)}</p>
        </div>
      </article>
    </Link>
  );
}

function TourTips({ onClose }) {
  return (
    <div className="dashboard-tour" role="dialog" aria-live="polite" aria-label="Guia rapida">
      <div className="dashboard-tour-header">
        <div>
          <p className="dashboard-tour-eyebrow">Guia rapida</p>
          <h3 className="dashboard-tour-title">Tres cosas para empezar</h3>
        </div>
        <button type="button" className="dashboard-tour-close" onClick={onClose} aria-label="Cerrar guia">
          x
        </button>
      </div>

      <div className="dashboard-tour-list">
        <div className="dashboard-tour-tip">
          <span className="dashboard-tour-number">1</span>
          <div>
            <strong>Buscar</strong>
            <p>Usa el buscador para encontrar por titulo, descripcion o usuario.</p>
          </div>
        </div>
        <div className="dashboard-tour-tip">
          <span className="dashboard-tour-number">2</span>
          <div>
            <strong>Filtrar</strong>
            <p>El sidebar te deja limitar por audio, video y orden.</p>
          </div>
        </div>
        <div className="dashboard-tour-tip">
          <span className="dashboard-tour-number">3</span>
          <div>
            <strong>Explorar</strong>
            <p>Abre cualquier tarjeta para ver el detalle completo.</p>
          </div>
        </div>
      </div>

      <button type="button" className="dashboard-tour-action" onClick={onClose}>
        Entendido
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("all");
  const [sortMode, setSortMode] = useState("featured");
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_KEY) === "true";
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    const loadDashboardContent = async () => {
      setIsLoadingContent(true);
      setContentError("");

      try {
        const [recommendedResult, recentResult] = await Promise.allSettled([
          fetch(buildApiUrl("/videos/recommended?limit=24")),
          fetch(buildApiUrl("/videos/recent?limit=12")),
        ]);

        const nextRecommended = [];
        const nextRecent = [];
        const issues = [];

        if (recommendedResult.status === "fulfilled") {
          const recommendedResponse = recommendedResult.value;
          if (recommendedResponse.ok) {
            const recommendedData = await recommendedResponse.json();
            nextRecommended.push(...(Array.isArray(recommendedData) ? recommendedData : []));
          } else {
            issues.push("recomendados");
          }
        } else {
          issues.push("recomendados");
        }

        if (recentResult.status === "fulfilled") {
          const recentResponse = recentResult.value;
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            nextRecent.push(...(Array.isArray(recentData) ? recentData : []));
          } else {
            issues.push("recientes");
          }
        } else {
          issues.push("recientes");
        }

        setRecommendedVideos(nextRecommended);
        setRecentVideos(nextRecent);
        setContentError(issues.length > 0 ? `No pudimos cargar: ${issues.join(" y ")}.` : "");
      } catch (error) {
        console.error("Error cargando contenido del dashboard:", error);
        setRecommendedVideos([]);
        setRecentVideos([]);
        setContentError("No pudimos cargar el contenido en este momento.");
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadDashboardContent();
  }, []);

  const filteredRecommended = useMemo(() => {
    const filtered = recommendedVideos.filter((archive) => {
      const typeMatches =
        archiveTypeFilter === "all" ||
        normalizeText(archive.archive_type) === archiveTypeFilter;

      return typeMatches && matchesSearch(archive, searchTerm);
    });

    return sortArchives(filtered, sortMode);
  }, [recommendedVideos, archiveTypeFilter, searchTerm, sortMode]);

  const filteredRecent = useMemo(() => {
    const filtered = recentVideos.filter((archive) => {
      const typeMatches =
        archiveTypeFilter === "all" ||
        normalizeText(archive.archive_type) === archiveTypeFilter;

      return typeMatches && matchesSearch(archive, searchTerm);
    });

    return sortArchives(filtered, sortMode);
  }, [recentVideos, archiveTypeFilter, searchTerm, sortMode]);

  const clearFilters = () => {
    setSearchTerm("");
    setArchiveTypeFilter("all");
    setSortMode("featured");
  };

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  return (
    <div className="dashboard-layout">
      <Header searchPlaceholder="Buscar por titulo, descripcion o usuario..." />

      <aside className="dashboard-sidebar">
        <div className="sidebar-scrollable">
          <div className="filter-section">
            <div className="filter-heading-row">
              <h3 className="filter-title">Filtros</h3>
              <button
                type="button"
                className="filter-help-btn"
                title="Reduce lo que ves en la portada para encontrar contenido mas rapido."
                aria-label="Ayuda de filtros"
              >
                ?
              </button>
            </div>
            <p className="filter-help-text">
              Busca, filtra por tipo y ordena el contenido desde aqui.
            </p>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Tipo de contenido</h3>
            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${archiveTypeFilter === "all" ? "active" : ""}`}
                onClick={() => setArchiveTypeFilter("all")}
                title="Muestra audio y video"
              >
                Todo
              </button>
              <button
                type="button"
                className={`filter-pill ${archiveTypeFilter === "audio" ? "active" : ""}`}
                onClick={() => setArchiveTypeFilter("audio")}
                title="Muestra solo archivos de audio"
              >
                Audio
              </button>
              <button
                type="button"
                className={`filter-pill ${archiveTypeFilter === "video" ? "active" : ""}`}
                onClick={() => setArchiveTypeFilter("video")}
                title="Muestra solo archivos de video"
              >
                Video
              </button>
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Ordenar por</h3>
            <label className="select-label" title="Elige como ordenar los resultados">
              <span>Modo</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="filter-select"
              >
                <option value="featured">Destacados</option>
                <option value="newest">Mas recientes</option>
                <option value="oldest">Mas antiguos</option>
                <option value="title">Titulo</option>
              </select>
            </label>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Acciones</h3>
            <button
              type="button"
              className="filter-reset-btn"
              onClick={clearFilters}
              title="Limpia busqueda, tipo y orden"
            >
              Limpiar filtros
            </button>
            <p className="filter-help-text">
              {isLoadingContent
                ? "Cargando contenido..."
                : `${filteredRecommended.length + filteredRecent.length} resultados visibles.`}
            </p>
          </div>
        </div>

        <div className="sidebar-status-container">
          <div className="sidebar-status-info">
            <span className="status-percent">3% de subidas usado</span>
            <div className="sidebar-progress-bar">
              <div className="sidebar-progress-fill" style={{ width: "3%" }}></div>
            </div>
            <span className="status-minutes">7 de 180 minutos</span>
          </div>
          <div
            className="sidebar-upgrade-link"
            onClick={() => setShowUpgradeModal(true)}
            style={{ cursor: "pointer" }}
            title="Mira el plan Pro para mas capacidad y funciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Actualiza a Pro
          </div>
        </div>
      </aside>

      <UpgradeOverlay isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {showTour && <TourTips onClose={closeTour} />}

      <main className="dashboard-main">
        <section className="carousel-container">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentBanner ? "active" : ""}`}
              style={{ backgroundImage: `url(${imageAssets[banner] || banner})` }}
            />
          ))}
          <div className="carousel-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentBanner ? "active" : ""}`}
                onClick={() => setCurrentBanner(index)}
                aria-label={`Ir a la imagen ${index + 1}`}
                title="Cambiar banner"
              />
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Descubrimiento</p>
              <h2 className="section-title">Recomendados para ti</h2>
            </div>
            <div className="section-copy-box" title="Este bloque explica la seccion para usuarios nuevos">
              <p className="section-copy">
                Contenido popular y variado para empezar a explorar sin perder tiempo.
              </p>
            </div>
          </div>

          {contentError && <div className="section-feedback error">{contentError}</div>}

          {!isLoadingContent && filteredRecommended.length === 0 && !contentError ? (
            <div className="empty-state">
              Todavia no hay recomendaciones para mostrar con estos filtros.
            </div>
          ) : (
            <div className="cards-grid">
              {filteredRecommended.map((archive) => (
                <ArchiveCard archive={archive} key={`recommended-${archive.project_id}`} />
              ))}
            </div>
          )}
        </section>

        <section className="content-section">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Novedades</p>
              <h2 className="section-title">Recientes</h2>
            </div>
            <div className="section-copy-box" title="Muestra lo ultimo publicado en la plataforma">
              <p className="section-copy">
                Lo ultimo que se publico en la plataforma, con contexto rapido para decidir que abrir.
              </p>
            </div>
          </div>

          {!isLoadingContent && filteredRecent.length === 0 && !contentError ? (
            <div className="empty-state">
              Todavia no hay contenido reciente para mostrar con estos filtros.
            </div>
          ) : (
            <div className="cards-grid">
              {filteredRecent.map((archive) => (
                <ArchiveCard archive={archive} key={`recent-${archive.project_id}`} />
              ))}
            </div>
          )}
        </section>
      </main>

      <MessagesWidget />
    </div>
  );
}
