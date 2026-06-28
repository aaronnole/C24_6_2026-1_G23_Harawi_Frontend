import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Onboarding.css";
import { buildApiUrl } from "./utils/api";

const roles = [
  {
    id: "Guitarra",
    title: "Guitarrista",
    description: "Si eres un guitarrista y te gustaría colaborar en alguna banda, proyecto solista o en un album, EP, canción o single.",
    icon: "./assets/icon_guitarrista.png" // Reemplaza con tus propias imagenes
  },
  {
    id: "Voz/Cantante",
    title: "Cantante",
    description: "Si crees que tu voz puede reflejar lo que cada canción quiere decir, interpretarlo y darle vida.",
    icon: "./assets/icon_cantante.png"
  },
  {
    id: "Composicion",
    title: "Compositor",
    description: "Si tienes la habilidad de llevar las canciones a otro nivel y crear obras auténticas.",
    icon: "./assets/composer.png"
  },
  {
    id: "Teclado",
    title: "Productor / Tecladista",
    description: "Si tienes la habilidad de llevar las canciones a otro nivel y crear obras auténticas.",
    icon: "./assets/producsmu.jpg"
  },
  {
    id: "Bajo",
    title: "Bajista",
    description: "Si tienes la habilidad de llevar las canciones a otro nivel y crear obras auténticas.",
    icon: "./assets/bajocicon.png"
  },
  {
    id: "Percusion",
    title: "Percusionista",
    description: "Si tienes la habilidad de llevar las canciones a otro nivel y crear obras auténticas.",
    icon: "./assets/percusionicon.jpg"
  }
];

const imageAssets = import.meta.glob('./assets/*', { eager: true, import: 'default' });

export default function Onboarding() {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId;

  const toggleRole = (id) => {
    if (selectedRoles.includes(id)) {
      setSelectedRoles(selectedRoles.filter(roleId => roleId !== id));
    } else {
      setSelectedRoles([...selectedRoles, id]);
    }
  };

  const handleNext = async () => {
    if (selectedRoles.length === 0) {
      alert("Por favor selecciona al menos un rol.");
      return;
    }

    if (!userId) {
      // Si por alguna razón no hay userId, pasamos directo o mostramos error
      console.warn("No hay userId para guardar instrumentos. Pasando al dashboard.");
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl("/user-instruments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          instruments: selectedRoles
        })
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error al guardar instrumentos");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión al guardar instrumentos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h1 className="onboarding-title">¿Qué tipo de músico eres?</h1>
          <p className="onboarding-subtitle">Escoge al menos una cosa que hagas como músico</p>
        </div>

        <div className="roles-grid">
          {roles.map(role => (
            <div
              key={role.id}
              className={`role-card ${selectedRoles.includes(role.id) ? 'selected' : ''}`}
              onClick={() => toggleRole(role.id)}
            >
              <div className="role-icon-container">
                <img src={imageAssets[role.icon] || role.icon} alt={role.title} className="role-icon" />
              </div>
              <h3 className="role-title">{role.title}</h3>
              <p className="role-description">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-actions">
        <button className="btn-next" onClick={handleNext} disabled={loading} aria-label="Siguiente">
          {loading ? (
            <span style={{ fontSize: '14px', color: 'black' }}>...</span>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* Barra decorativa inferior */}
      <div className="bottom-bar" />
    </div>
  );
}
