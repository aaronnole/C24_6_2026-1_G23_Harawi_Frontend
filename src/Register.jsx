import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import studioImg from "./assets/login_image.jpg"; // Usamos la misma imagen como base, puedes cambiarla luego
import { buildApiUrl } from "./utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    country: "",
    city: "",
    type_user: "",
    birth_date: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    // Validación de contraseña
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registro exitoso:", data);
        // Siempre mostrar el mensaje de verificar correo primero
        setIsRegistered(true);
      } else {
        setError(data.message || "Error al registrarse");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Panel izquierdo */}
      <div className="register-left">
        <div className="register-inner">
          <h1 className="register-title">Regístrate</h1>

          <div className="register-box">
            <div className="register-form">
              {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px', fontSize: '0.85rem' }}>{error}</div>}

              {isRegistered ? (
                <div className="registration-success" style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="success-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                  <h2 style={{ color: '#2ecc71', marginBottom: '1rem' }}>¡Verifica tu correo!</h2>
                  <p style={{ color: '#ccc', marginBottom: '1rem' }}>Hemos enviado un enlace de activación a <strong>{formData.email}</strong>.</p>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>Por favor, haz clic en el enlace para poder iniciar sesión.</p>
                  <Link to="/login" className="btn-signin" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>Volver al Login</Link>
                </div>
              ) : (
                <>
                  <div className="field-row">
                    <div className="field-group half">
                      <label htmlFor="first_name">Nombre</label>
                      <input id="first_name" type="text" placeholder="Ej. Juan" value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div className="field-group half">
                      <label htmlFor="last_name">Apellido</label>
                      <input id="last_name" type="text" placeholder="Ej. Pérez" value={formData.last_name} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="username">Nombre de usuario</label>
                    <input id="username" type="text" placeholder="perez_juan" value={formData.username} onChange={handleChange} />
                  </div>

                  <div className="field-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input id="email" type="email" placeholder="juan@ejemplo.com" value={formData.email} onChange={handleChange} />
                  </div>

                  <div className="field-group">
                    <label htmlFor="password">Contraseña</label>
                    <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                  </div>

                  <div className="field-row">
                    <div className="field-group half">
                      <label htmlFor="country">País</label>
                      <input id="country" type="text" placeholder="Perú" value={formData.country} onChange={handleChange} />
                    </div>
                    <div className="field-group half">
                      <label htmlFor="city">Ciudad</label>
                      <input id="city" type="text" placeholder="Lima" value={formData.city} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-group half">
                      <label htmlFor="type_user">Tipo de cuenta</label>
                      <select id="type_user" value={formData.type_user} onChange={handleChange}>
                        <option value="" disabled>Artista o sello discográfico?</option>
                        <option value="artist">Artista</option>
                        <option value="label">Sello discográfico</option>
                      </select>
                    </div>
                    <div className="field-group half">
                      <label htmlFor="birth_date">Fecha de nacimiento</label>
                      <input id="birth_date" type="date" value={formData.birth_date} onChange={handleChange} />
                    </div>
                  </div>

                  <button className="btn-register" onClick={handleRegister} disabled={loading}>
                    {loading ? "Registrando..." : "Registrarse"}
                  </button>

                  <div className="register-links">
                    <Link to="/login">Ya tengo una cuenta</Link>
                  </div>
                </>
              )}
            </div>

            <button className="btn-google">
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.1 29.52 1 24 1 14.82 1 6.97 6.5 3.28 14.44l7.1 5.52C12.14 13.87 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.66c-.55 2.94-2.2 5.43-4.68 7.1l7.18 5.58C43.18 37.3 46.52 31.36 46.52 24.5z" />
                <path fill="#FBBC05" d="M10.38 28.44A14.56 14.56 0 0 1 9.5 24c0-1.54.26-3.04.72-4.44l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.86.92 7.5 2.56 10.72l7.82-6.28z" />
                <path fill="#34A853" d="M24 47c5.52 0 10.14-1.83 13.52-4.96l-7.18-5.58c-1.98 1.34-4.52 2.14-6.34 2.14-6.4 0-11.86-4.37-13.62-10.16l-7.82 6.28C6.97 41.5 14.82 47 24 47z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>

      {/* Panel derecho — imagen */}
      <div className="register-right">
        <img src={studioImg} alt="Consola de audio" className="hero-image" />
      </div>

      {/* Barra decorativa inferior */}
      <div className="bottom-bar" />
    </div>
  );
}
