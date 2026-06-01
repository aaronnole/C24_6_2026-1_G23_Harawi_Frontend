import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "./Header";
import MessagesWidget from "./MessagesWidget";
import "./Profile.css";
import { canInteractWithUser, isSameUser } from "./utils/socialRules";
import {
  fetchFollowers,
  fetchFollowing,
  fetchFollowStatus,
  fetchPublicUser,
  followUser,
  unfollowUser,
} from "./utils/socialApi";

const imageAssets = import.meta.glob("./assets/*", { eager: true, import: "default" });

const FOLLOWERS_LIMIT = 30;

function FollowListModal({
  isOpen,
  title,
  items,
  isLoading,
  error,
  onClose,
  onOpenProfile,
}) {
  if (!isOpen) return null;

  return (
    <div className="follow-modal-backdrop" onClick={onClose} role="presentation">
      <div className="follow-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="follow-modal-header">
          <div>
            <p className="follow-modal-eyebrow">Social</p>
            <h3 className="follow-modal-title">{title}</h3>
          </div>
          <button type="button" className="follow-modal-close" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </div>

        <div className="follow-modal-body">
          {isLoading ? (
            <div className="follow-modal-state">Cargando...</div>
          ) : error ? (
            <div className="follow-modal-state error">{error}</div>
          ) : items.length === 0 ? (
            <div className="follow-modal-state">Todavia no hay usuarios para mostrar.</div>
          ) : (
            items.map((item) => (
              <button
                key={item.user_id}
                type="button"
                className="follow-user-row"
                onClick={() => onOpenProfile(item.user_id)}
              >
                <img
                  src={item.profile_picture_url ? `http://localhost:3001${item.profile_picture_url}` : imageAssets["./assets/gatoportada.jpg"]}
                  alt={item.username}
                  className="follow-user-avatar"
                />
                <div className="follow-user-meta">
                  <span className="follow-user-name">{item.username}</span>
                  {item.followed_at && <span className="follow-user-date">Desde {new Date(item.followed_at).toLocaleDateString("es-CO")}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user_id: routeUserId } = useParams();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const [followState, setFollowState] = useState({
    isFollowing: false,
    isSelf: false,
    isLoaded: false,
  });
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState("followers");
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListError, setFollowListError] = useState("");

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const targetUserId = routeUserId || currentUser?.user_id;
  const isOwnProfile = isSameUser(currentUser?.user_id, targetUserId);

  const getImagePath = (name) => {
    const path = `./assets/${name}`;
    return imageAssets[path] || path;
  };

  const truncateDescription = (text) => {
    if (!text) return "";
    return text.length > 40 ? `${text.slice(0, 40)} ...` : text;
  };

  const loadProfileData = async () => {
    if (!targetUserId) return;

    try {
      const [userData, projectsResponse] = await Promise.all([
        fetchPublicUser(targetUserId),
        fetch(`http://localhost:3001/api/projects/user/${targetUserId}`),
      ]);

      setUser(userData);

      if (!projectsResponse.ok) {
        throw new Error("Error al cargar proyectos");
      }

      const projectsData = await projectsResponse.json();
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      if (currentUser?.user_id && !isSameUser(currentUser.user_id, targetUserId)) {
        const status = await fetchFollowStatus(targetUserId, currentUser.user_id);
        setFollowState({
          isFollowing: Boolean(status?.is_following),
          isSelf: Boolean(status?.is_self),
          isLoaded: true,
        });
      } else {
        setFollowState({
          isFollowing: false,
          isSelf: true,
          isLoaded: true,
        });
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setUser(null);
      setProjects([]);
      setFollowState({
        isFollowing: false,
        isSelf: Boolean(isOwnProfile),
        isLoaded: true,
      });
    }
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const goToVideo = (projectId) => {
    navigate(`/video/${projectId}`);
  };

  const openFollowList = async (type) => {
    if (!user?.user_id) return;

    setFollowListType(type);
    setFollowListOpen(true);
    setFollowListLoading(true);
    setFollowListError("");

    try {
      const data =
        type === "followers"
          ? await fetchFollowers(user.user_id, FOLLOWERS_LIMIT)
          : await fetchFollowing(user.user_id, FOLLOWERS_LIMIT);

      setFollowList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando lista social:", error);
      setFollowList([]);
      setFollowListError("No se pudo cargar la lista.");
    } finally {
      setFollowListLoading(false);
    }
  };

  const closeFollowList = () => {
    setFollowListOpen(false);
    setFollowList([]);
    setFollowListError("");
  };

  const openProfileFromList = (userId) => {
    closeFollowList();
    navigate(`/profile/${userId}`);
  };

  const refreshAfterFollowChange = async () => {
    if (!targetUserId) return;

    const [updatedUser, updatedStatus] = await Promise.all([
      fetchPublicUser(targetUserId),
      currentUser?.user_id && !isSameUser(currentUser.user_id, targetUserId)
        ? fetchFollowStatus(targetUserId, currentUser.user_id)
        : Promise.resolve({ is_following: false, is_self: true }),
    ]);

    setUser(updatedUser);
    setFollowState({
      isFollowing: Boolean(updatedStatus?.is_following),
      isSelf: Boolean(updatedStatus?.is_self),
      isLoaded: true,
    });
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.user_id || !user?.user_id) return;
    if (!canInteractWithUser(currentUser.user_id, user.user_id)) return;

    setIsFollowActionLoading(true);

    try {
      if (followState.isFollowing) {
        await unfollowUser(user.user_id, currentUser.user_id);
      } else {
        await followUser(user.user_id, currentUser.user_id);
      }

      await refreshAfterFollowChange();
    } catch (error) {
      console.error("Error actualizando seguimiento:", error);
      alert(error.message || "No se pudo actualizar el seguimiento.");
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleSendMessageToUser = async () => {
    if (!currentUser?.user_id || !user?.user_id) return;
    if (!canInteractWithUser(currentUser.user_id, user.user_id)) return;

    try {
      const response = await fetch("http://localhost:3001/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_one_id: currentUser.user_id,
          user_two_id: user.user_id,
        }),
      });

      if (!response.ok) throw new Error("No se pudo crear la conversacion");
      const data = await response.json();
      const conversationId = data?.conversation_id;
      if (!conversationId) throw new Error("Conversacion invalida");

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error iniciando chat:", error);
      alert("No se pudo abrir el chat.");
    }
  };

  const handleProfilePictureClick = () => {
    if (isOwnProfile && user && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !isOwnProfile) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen valido (JPG, PNG, etc).");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("La imagen es demasiado grande. El limite es de 5MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.user_id}/profile-picture`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();

      const updatedUser = { ...user, profile_picture_url: data.profile_picture_url };
      setUser(updatedUser);
      if (currentUser && Number(currentUser.user_id) === Number(user.user_id)) {
        localStorage.setItem("user", JSON.stringify({ ...currentUser, profile_picture_url: data.profile_picture_url }));
        window.dispatchEvent(new Event("userUpdated"));
      }

      alert("Foto de perfil actualizada exitosamente!");
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al actualizar la foto de perfil. Intentalo de nuevo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile && user && !isUploadingCover) {
      coverInputRef.current?.click();
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !isOwnProfile) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen valido (JPG, PNG, etc).");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("La imagen es demasiado grande. El limite es de 5MB.");
      return;
    }

    setIsUploadingCover(true);
    const formData = new FormData();
    formData.append("cover_picture", file);

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.user_id}/cover-picture`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen de portada");
      }

      const data = await response.json();

      const updatedUser = { ...user, cover_picture_url: data.cover_picture_url };
      setUser(updatedUser);
      if (currentUser && Number(currentUser.user_id) === Number(user.user_id)) {
        localStorage.setItem("user", JSON.stringify({ ...currentUser, cover_picture_url: data.cover_picture_url }));
      }

      alert("Foto de portada actualizada exitosamente!");
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al actualizar la foto de portada. Intentalo de nuevo.");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const followersCount = Number(user?.followers_count || 0);
  const followingCount = Number(user?.following_count || 0);
  const showFollowControls =
    followState.isLoaded && currentUser?.user_id && user?.user_id && canInteractWithUser(currentUser.user_id, user.user_id);

  return (
    <div className="profile-layout">
      <Header />

      <main className="profile-main">
        <div className="profile-header">
          <div
            className={`profile-banner ${isOwnProfile && user && !isUploadingCover ? "uploadable" : ""}`}
            onClick={handleCoverClick}
          >
            <img
              src={user?.cover_picture_url ? `http://localhost:3001${user.cover_picture_url}` : getImagePath("banner1mcdonalds.png")}
              alt="Banner"
              className={`banner-img ${isUploadingCover ? "uploading" : ""}`}
            />
            {isOwnProfile && user && !isUploadingCover && (
              <div className="profile-banner-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>Cambiar Portada</span>
              </div>
            )}
            {isUploadingCover && (
              <div className="profile-banner-overlay uploading-overlay">
                <span>Subiendo...</span>
              </div>
            )}
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-info-section">
            <div
              className={`profile-picture-container ${isOwnProfile && user && !isUploading ? "uploadable" : ""}`}
              onClick={handleProfilePictureClick}
            >
              <img
                src={user?.profile_picture_url ? `http://localhost:3001${user.profile_picture_url}` : getImagePath("gatoportada.jpg")}
                alt="Profile"
                className={`profile-picture ${isUploading ? "uploading" : ""}`}
              />
              {isOwnProfile && user && !isUploading && (
                <div className="profile-picture-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span>Cambiar</span>
                </div>
              )}
              {isUploading && (
                <div className="profile-picture-overlay uploading-overlay">
                  <span>Subiendo...</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            <div className="profile-details">
              <div className="profile-details-main">
                <div className="profile-main-row">
                  <div className="profile-identity">
                    <h1 className="profile-username">{user ? user.username : "username"}</h1>
                    {showFollowControls && (
                      <div className="profile-actions">
                        <button
                          className={`profile-follow-btn ${followState.isFollowing ? "following" : ""}`}
                          onClick={handleFollowToggle}
                          disabled={isFollowActionLoading}
                        >
                          {isFollowActionLoading ? "Procesando..." : followState.isFollowing ? "Siguiendo" : "Seguir"}
                        </button>
                        {canInteractWithUser(currentUser?.user_id, user?.user_id) && (
                          <button className="profile-message-btn" onClick={handleSendMessageToUser}>
                            Mandar mensaje
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="profile-stats">
                    <button type="button" className="stat-item stat-button" onClick={() => openFollowList("followers")}>
                      <span className="stat-label">Seguidores</span>
                      <span className="stat-value">{followersCount}</span>
                    </button>
                    <button type="button" className="stat-item stat-button" onClick={() => openFollowList("following")}>
                      <span className="stat-label">Siguiendo</span>
                      <span className="stat-value">{followingCount}</span>
                    </button>
                    <button type="button" className="stat-item stat-button stat-static" disabled aria-label="Publicaciones">
                      <span className="stat-label">Publicaciones</span>
                      <span className="stat-value">{projects.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="tracks-list">
          {projects.map((project) => (
            <div key={project.project_id} className="track-item-container">
              <div className="track-cover" onClick={() => goToVideo(project.project_id)} style={{ cursor: "pointer" }}>
                <img
                  src={project.thumbnail_url ? `http://localhost:3001${project.thumbnail_url}` : getImagePath("gatoportada.jpg")}
                  alt="Cover"
                />
              </div>

              <div className="track-content">
                <div className="track-info-row">
                  <div className="track-info">
                    <button className="play-btn" onClick={() => goToVideo(project.project_id)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                    </button>
                    <div className="track-text">
                      <span className="track-author">{user ? user.username : "username"}</span>
                      <span className="track-title">{project.title}</span>
                      <span className="track-desc">{truncateDescription(project.description)}</span>
                    </div>
                  </div>

                  <div className="track-actions">
                    <button className="action-btn" title={project.visibility === "PRIVATE" ? "Privado" : "Publico"}>
                      {project.visibility === "PRIVATE" ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                      )}
                    </button>
                    <button className="action-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                    </button>
                    <button className="action-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    </button>
                    <button className="action-btn text-danger">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>

                <div className="comment-box">
                  <div className="comment-avatar">
                    <img src={getImagePath("gatoportada.jpg")} alt="User" />
                  </div>
                  <div className="comment-input-wrapper">
                    <input type="text" placeholder="Escribe un comentario ..." className="comment-input" />
                  </div>
                  <button className="send-comment-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <FollowListModal
        isOpen={followListOpen}
        title={followListType === "followers" ? "Seguidores" : "Siguiendo"}
        items={followList}
        isLoading={followListLoading}
        error={followListError}
        onClose={closeFollowList}
        onOpenProfile={openProfileFromList}
      />

      <MessagesWidget />
    </div>
  );
}
