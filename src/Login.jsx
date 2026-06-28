import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import studioImg from "./assets/login_image.jpg"; // Reemplaza con el nombre de tu imagen en assets
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import OnboardingModal from "./OnboardingModal";
import LabelOnboardingModal from "./LabelOnboardingModal";
import { buildApiUrl } from "./utils/api";

export default function Login() {
  const [progress] = useState(36); // 1:23 de 3:21 ≈ 36%
  const [liked, setLiked] = useState(false);
  const [isPlaying] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLabelOnboarding, setShowLabelOnboarding] = useState(false);
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login manual exitoso:", data);
        setUserData(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Si es artista y no ha seleccionado instrumentos, redirigir a onboarding; 
        // si es label y no tiene datos, redirigir a label onboarding; 
        // caso contrario, ir al dashboard.
        if (data.user.type_user === "artist" && data.needsArtistOnboarding) {
          navigate("/onboarding", { state: { userId: data.user.user_id } });
        } else if (data.needsLabelOnboarding) {
          setShowLabelOnboarding(true);
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Error al iniciar sesión");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(buildApiUrl("/google-login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: tokenResponse.access_token,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          if (data.needsOnboarding) {
            setShowOnboarding(true);
          } else {
            // Si es artista y no ha seleccionado instrumentos, lo pasamos a /onboarding.
            if (data.user.type_user === "artist" && data.needsArtistOnboarding) {
              navigate("/onboarding", { state: { userId: data.user.user_id } });
            } else if (data.needsLabelOnboarding) {
              setShowLabelOnboarding(true);
            } else {
              navigate("/dashboard");
            }
          }
        } else {
          console.error("Error en el login de Google");
        }
      } catch (error) {
        console.error("Error de red:", error);
      }
    },
    onError: () => console.log("Login con Google fallido"),
  });

  const handleOnboardingComplete = (selectedType) => {
    setShowOnboarding(false);
    if (selectedType === 'label') {
      setShowLabelOnboarding(true);
    } else if (selectedType === 'artist') {
      // Como recién hizo onboarding con Google, seguro necesita elegir sus instrumentos
      navigate("/onboarding", { state: { userId: userData?.user_id } });
    } else {
      navigate("/dashboard");
    }
  };

  const handleLabelOnboardingComplete = () => {
    setShowLabelOnboarding(false);
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-inner">
          <h1 className="login-title">¡Bienvenido!</h1>

          <div className="login-box">
            <form className="login-form" onSubmit={handleSignIn}>
              {error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
              
              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <button className="btn-signin" type="submit" disabled={loading}>
                {loading ? "Iniciando..." : "Sign In"}
              </button>

              <div className="login-links">
                <Link to="/forgot-password">¿Olvidaste la contraseña?</Link>
                <Link to="/register">No tengo una cuenta</Link>
              </div>
            </form>

            <button className="btn-google" onClick={() => handleGoogleLogin()}>
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.1 29.52 1 24 1 14.82 1 6.97 6.5 3.28 14.44l7.1 5.52C12.14 13.87 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.66c-.55 2.94-2.2 5.43-4.68 7.1l7.18 5.58C43.18 37.3 46.52 31.36 46.52 24.5z" />
                <path fill="#FBBC05" d="M10.38 28.44A14.56 14.56 0 0 1 9.5 24c0-1.54.26-3.04.72-4.44l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.86.92 7.5 2.56 10.72l7.82-6.28z" />
                <path fill="#34A853" d="M24 47c5.52 0 10.14-1.83 13.52-4.96l-7.18-5.58c-1.98 1.34-4.52 2.14-6.34 2.14-6.4 0-11.86-4.37-13.62-10.16l-7.82 6.28C6.97 41.5 14.82 47 24 47z" />
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Reproductor estético (sin funcionalidad real) */}
          <div className="player">
            <div className="player-progress-bar">
              <span className="time">1:23</span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
                <div className="progress-thumb" style={{ left: `${progress}%` }} />
              </div>
              <span className="time">3:21</span>
            </div>

            <div className="player-controls">
              <button
                className={`ctrl-btn like-btn ${liked ? "liked" : ""}`}
                onClick={() => setLiked(!liked)}
                aria-label="Like"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <div className="center-controls">
                <button className="ctrl-btn" aria-label="Previous">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                <button className="ctrl-btn play-pause-btn" aria-label="Play/Pause">
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <button className="ctrl-btn" aria-label="Next">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="side-controls">
                <button
                  className={`ctrl-btn small-btn ${shuffle ? "active" : ""}`}
                  onClick={() => setShuffle(!shuffle)}
                  aria-label="Shuffle"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                  </svg>
                </button>

                <button
                  className={`ctrl-btn small-btn ${repeat ? "active" : ""}`}
                  onClick={() => setRepeat(!repeat)}
                  aria-label="Repeat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — imagen */}
      <div className="login-right">
        <img src={studioImg} alt="Estudio de grabación" className="hero-image" />
      </div>

      {/* Barra decorativa inferior */}
      <div className="bottom-bar" />

      {showOnboarding && userData && (
        <OnboardingModal 
          user={userData} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      {showLabelOnboarding && userData && (
        <LabelOnboardingModal 
          user={userData} 
          onComplete={handleLabelOnboardingComplete} 
        />
      )}
    </div>
  );
}
