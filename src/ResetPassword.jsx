import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Login.css";
import studioImg from "./assets/login_image.jpg";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Error al restablecer la contraseña.");
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
          <h1 className="login-title">Nueva Contraseña</h1>

          <div className="login-box">
            {success ? (
              <div className="login-form" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <h2 style={{ color: "#2ecc71", marginBottom: "1rem" }}>¡Contraseña actualizada!</h2>
                <p style={{ color: "#ccc", marginBottom: "2rem" }}>Tu contraseña fue cambiada con éxito. Ya puedes iniciar sesión.</p>
                <Link to="/login" className="btn-signin" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                  Ir al Login
                </Link>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleSubmit}>
                {error && <div className="error-message" style={{ color: "#ff4d4d", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

                {!token ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                    <p style={{ color: "#ff4d4d" }}>El enlace es inválido. Solicita uno nuevo desde el login.</p>
                    <Link to="/login" className="btn-signin" style={{ display: "block", textDecoration: "none", textAlign: "center", marginTop: "2rem" }}>
                      Volver al Login
                    </Link>
                  </div>
                ) : (
                  <>
                    <p style={{ color: "#aaa", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                      Ingresa tu nueva contraseña (mínimo 8 caracteres).
                    </p>

                    <div className="field-group">
                      <label htmlFor="newPassword">Nueva contraseña</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="confirmPassword">Confirmar contraseña</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>

                    <button className="btn-signin" type="submit" disabled={loading}>
                      {loading ? "Guardando..." : "Cambiar contraseña"}
                    </button>
                  </>
                )}
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
