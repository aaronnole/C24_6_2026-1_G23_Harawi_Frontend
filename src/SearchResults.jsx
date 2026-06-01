import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "./Header";
import MessagesWidget from "./MessagesWidget";
import "./SearchResults.css";

const imageAssets = import.meta.glob("./assets/*", { eager: true, import: "default" });
const fallbackImage = imageAssets["./assets/gatoportada.jpg"] || "./assets/gatoportada.jpg";

const getArchiveLabel = (archiveType) => (
  archiveType === "AUDIO" ? "Audio" : "Video"
);

const getArchiveDescription = (archive) => {
  if (!archive?.description) return "Sin descripción disponible.";

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

function ArchiveCard({ archive }) {
  return (
    <Link to={`/video/${archive.project_id}`} className="content-card-link">
      <article className="content-card">
        <div className="card-image-container">
          <img
            src={archive.thumbnail_url ? `http://localhost:3001${archive.thumbnail_url}` : fallbackImage}
            alt={archive.title || getArchiveLabel(archive.archive_type)}
            className="card-image"
          />
          <span className="card-type-badge">{getArchiveLabel(archive.archive_type)}</span>
        </div>

        <div className="card-info">
          <p className="card-meta">
            {archive.username || "Usuario desconocido"} · {formatCardDate(archive.creation_date)}
          </p>
          <h4 className="card-desc">{archive.title || "Sin título"}</h4>
          <p className="card-summary">{getArchiveDescription(archive)}</p>
        </div>
      </article>
    </Link>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => String(searchParams.get("q") || "").trim(), [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const loadResults = async () => {
      if (!query) {
        setResults([]);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3001/api/videos/search?q=${encodeURIComponent(query)}&limit=48`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar la búsqueda");
        }

        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error en búsqueda:", err);
        setResults([]);
        setError("No pudimos ejecutar la búsqueda en este momento.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();

    return () => controller.abort();
  }, [query]);

  return (
    <div className="search-page">
      <Header
        searchTerm={query}
        onSearchChange={(nextValue) => {
          const nextQuery = String(nextValue || "").trim();
          if (!nextQuery) {
            setSearchParams({});
            return;
          }
          setSearchParams({ q: nextQuery });
        }}
      />

      <main className="search-page-main">
        <section className="search-content-section">
          <div className="search-results-header">
            <p className="search-eyebrow">Resultados</p>
            <h1 className="search-title">
              {query ? `Búsqueda: "${query}"` : "Busca por proyecto o usuario"}
            </h1>
          </div>

          {error && <div className="section-feedback error">{error}</div>}

          {!query && (
            <div className="empty-state">
              Escribe en el buscador del header para encontrar proyectos o usuarios.
            </div>
          )}

          {query && !isLoading && results.length === 0 && !error && (
            <div className="empty-state">
              No encontramos coincidencias para tu búsqueda.
            </div>
          )}

          {query && results.length > 0 && (
            <div className="cards-grid">
              {results.map((archive) => (
                <ArchiveCard archive={archive} key={`search-${archive.project_id}`} />
              ))}
            </div>
          )}
        </section>
      </main>

      <MessagesWidget />
    </div>
  );
}
