import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import UpgradeOverlay from "./UpgradeOverlay";

export default function Header({
  searchTerm: controlledSearchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar por proyecto o usuario...",
}) {
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState(null);
  const searchTerm = controlledSearchTerm ?? localSearchTerm;

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };

    // Cargar en el montaje
    loadUser();

    // Escuchar actualizaciones (ej. cuando se cambia la foto desde Profile.jsx)
    window.addEventListener('userUpdated', loadUser);

    return () => {
      window.removeEventListener('userUpdated', loadUser);
    };
  }, []);

  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      return undefined;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/notifications/${user.user_id}`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las notificaciones.");
        }
        const data = await response.json();
        if (!cancelled) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando notificaciones:", error);
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.user_id]);

  const handleLogout = (e) => {
    e.stopPropagation();
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goHome = () => {
    navigate("/dashboard");
  };

  const clearSearch = () => {
    if (onSearchChange) {
      onSearchChange("");
      return;
    }
    setLocalSearchTerm("");
  };

  const goToUpload = () => {
    navigate("/upload");
  };

  const toggleNotifications = () => {
    setNotificationsOpen((current) => !current);
  };

  const handleNotificationResponse = async (notificationId, action) => {
    if (!user?.user_id) return;

    setNotificationActionId(notificationId);
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          action,
        }),
      });

      if (!response.ok) {
        let message = "No se pudo responder la invitacion.";
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }

      const nextStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notificationId
            ? { ...item, status: nextStatus, responded_at: new Date().toISOString() }
            : item
        )
      );
    } catch (error) {
      console.error("Error respondiendo invitacion:", error);
      alert(error.message || "No se pudo responder la invitacion.");
    } finally {
      setNotificationActionId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (onSearchChange) {
      return;
    }

    const query = searchTerm.trim();

    if (!query) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const pendingNotificationsCount = notifications.filter((item) => item.status === "PENDING").length;

  return (
    <>
      <header className="main-header">
        <form className="search-bar-container" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            className="search-input" 
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              if (onSearchChange) {
                onSearchChange(value);
                return;
              }
              setLocalSearchTerm(value);
            }}
          />
          {searchTerm && (
            <button type="button" className="clear-search-btn" onClick={clearSearch}>✕</button>
          )}
        </form>
        <div className="header-actions">
          <button id="upload" className="header-create-btn" aria-label="Subir" onClick={goToUpload}>
            <span className="header-create-text">Subir</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
          <button id="home" className="icon-btn" aria-label="Home" onClick={goHome}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </button>
          <div className="header-notifications">
            <button id="notifications" className="icon-btn notification-trigger" aria-label="Notifications" onClick={toggleNotifications}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {pendingNotificationsCount > 0 ? (
                <span className="notification-badge">{pendingNotificationsCount}</span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="notifications-popover">
                <div className="notifications-popover-header">
                  <strong>Invitaciones</strong>
                </div>

                <div className="notifications-popover-body">
                  {notificationsLoading ? (
                    <div className="notifications-empty">Cargando...</div>
                  ) : notifications.length === 0 ? (
                    <div className="notifications-empty">No tienes notificaciones por ahora.</div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.notification_id} className="notification-card">
                        <p className="notification-text">
                          <strong>@{notification.sender_username}</strong> te invito a colaborar en <strong>{notification.project_title}</strong>.
                        </p>
                        <span className={`notification-status ${notification.status.toLowerCase()}`}>
                          {notification.status === "PENDING"
                            ? "Pendiente"
                            : notification.status === "ACCEPTED"
                              ? "Aceptada"
                              : "Rechazada"}
                        </span>

                        {notification.status === "PENDING" ? (
                          <div className="notification-actions">
                            <button
                              type="button"
                              className="notification-btn accept"
                              onClick={() => handleNotificationResponse(notification.notification_id, "accept")}
                              disabled={notificationActionId === notification.notification_id}
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              className="notification-btn reject"
                              onClick={() => handleNotificationResponse(notification.notification_id, "reject")}
                              disabled={notificationActionId === notification.notification_id}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <button id="friend_request" className="icon-btn" aria-label="Users">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </button>

          <button className="header-upgrade-btn" onClick={() => setShowUpgradeModal(true)}>
            Actualiza a pro
          </button>

          <div className="user-profile" onClick={goToProfile} style={{ cursor: 'pointer' }}>
            {user && user.profile_picture_url ? (
              <img 
                src={`http://localhost:3001${user.profile_picture_url}`} 
                alt="Avatar" 
                className="avatar" 
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar">{user ? user.username.charAt(0).toUpperCase() : 'U'}</div>
            )}
            <div className="user-info">
              <span className="user-name">{user ? user.username : 'username'}</span>
              <span className="logout-text" onClick={handleLogout}>Cerrar sesión</span>
            </div>
          </div>
        </div>
      </header>

      <UpgradeOverlay isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}
