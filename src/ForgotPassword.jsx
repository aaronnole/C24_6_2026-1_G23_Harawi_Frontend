import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import studioImg from "./assets/login_image.jpg";
import { buildApiUrl } from "./utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(buildApiUrl("/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || "Ocurrió un error.");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-inner">
          <h1 className="login-title">Recuperar Contraseña</h1>

          <div className="login-box">
            {message ? (
              <div className="login-form" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
                <h2 style={{ color: "#2ecc71", marginBottom: "1rem" }}>¡Revisa tu correo!</h2>
                <p style={{ color: "#ccc", marginBottom: "1rem" }}>{message}</p>
                <Link to="/login" className="btn-signin" style={{ display: "block", textDecoration: "none", textAlign: "center", marginTop: "2rem" }}>
                  Volver al Login
                </Link>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleSubmit}>
                {error && <div className="error-message" style={{ color: "#ff4d4d", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

                <p style={{ color: "#aaa", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div className="field-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                  />
                </div>

                <button className="btn-signin" type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>

                <div className="login-links" style={{ marginTop: "1rem" }}>
                  <Link to="/login">Volver al Login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="login-right">
        <img src={studioImg} alt="Estudio de grabación" className="hero-image" />
      </div>

      <div className="bottom-bar" />
    </div>
  );
}
