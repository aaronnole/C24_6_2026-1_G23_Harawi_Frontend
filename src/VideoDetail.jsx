import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";
import Header from "./Header";
import MessagesWidget from "./MessagesWidget";
import "./VideoDetail.css";
import { canInteractWithUser } from "./utils/socialRules";
import {
  fetchFollowStatus,
  fetchPublicUser,
  followUser,
  unfollowUser,
} from "./utils/socialApi";

const imageAssets = import.meta.glob("./assets/*", { eager: true, import: "default" });

const recommendations = [
  { id: 1, title: "Titulo 1", user: "Usuario" },
  { id: 2, title: "Titulo 2", user: "Usuario" },
  { id: 3, title: "Titulo 3", user: "Usuario" },
  { id: 4, title: "Titulo 4", user: "Usuario" },
  { id: 5, title: "Titulo 5", user: "Usuario" },
  { id: 6, title: "Titulo 6", user: "Usuario" },
];

export default function VideoDetail() {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isWaveReady, setIsWaveReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [followState, setFollowState] = useState({
    isFollowing: false,
    isSelf: false,
    isLoaded: false,
  });
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:3001/api/video-detail/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando detalle de video");
        return res.json();
      })
      .then((data) => setVideoData(data))
      .catch((err) => {
        console.error("Error cargando video:", err);
        setVideoData(null);
      });

    fetch(`http://localhost:3001/api/projects/${id}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando comentarios");
        return res.json();
      })
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error cargando comentarios:", err);
        setComments([]);
      });
  }, [id]);

  useEffect(() => {
    if (!videoData?.user_id) {
      setAuthorData(null);
      setFollowState({
        isFollowing: false,
        isSelf: false,
        isLoaded: false,
      });
      return;
    }

    let cancelled = false;

    const loadAuthorData = async () => {
      try {
        const [publicUser, followStatus] = await Promise.all([
          fetchPublicUser(videoData.user_id),
          currentUser?.user_id && canInteractWithUser(currentUser.user_id, videoData.user_id)
            ? fetchFollowStatus(videoData.user_id, currentUser.user_id)
            : Promise.resolve({ is_following: false, is_self: true }),
        ]);

        if (cancelled) return;

        setAuthorData(publicUser);
        setFollowState({
          isFollowing: Boolean(followStatus?.is_following),
          isSelf: Boolean(followStatus?.is_self),
          isLoaded: true,
        });
      } catch (error) {
        console.error("Error cargando autor:", error);
        if (cancelled) return;

        setAuthorData(null);
        setFollowState({
          isFollowing: false,
          isSelf: false,
          isLoaded: true,
        });
      }
    };

    loadAuthorData();

    return () => {
      cancelled = true;
    };
  }, [videoData?.user_id, currentUser?.user_id]);

  useEffect(() => {
    if (videoData?.archive_type !== "AUDIO") return undefined;
    if (!waveformRef.current) return undefined;
    if (!videoData?.url_archive) return undefined;

    setIsWaveReady(false);

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      url: `http://localhost:3001${videoData.url_archive}`,
      waveColor: "#a8adb5",
      progressColor: "#1f2328",
      cursorColor: "#1f2328",
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 120,
      normalize: true,
      interact: true,
    });

    waveSurferRef.current = ws;
    ws.on("ready", () => setIsWaveReady(true));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    ws.on("error", (err) => {
      console.error("Error cargando wavesurfer:", err);
      setIsWaveReady(false);
      setIsPlaying(false);
    });

    return () => {
      ws.destroy();
      waveSurferRef.current = null;
      setIsWaveReady(false);
      setIsPlaying(false);
    };
  }, [videoData?.archive_type, videoData?.url_archive]);

  const toggleAudioPlayback = () => {
    const ws = waveSurferRef.current;
    if (!ws || !isWaveReady) return;
    ws.playPause();
  };

  const getImagePath = (name) => {
    const path = `./assets/${name}`;
    return imageAssets[path] || path;
  };

  const goToAuthorProfile = () => {
    if (videoData?.user_id) {
      navigate(`/profile/${videoData.user_id}`);
    }
  };

  const formatUploadDate = (rawDate) => {
    if (!rawDate) return "Fecha no disponible";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
    return parsed.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAddComment = async () => {
    if (!id) return;

    const comment = newComment.trim();
    if (!comment) return;

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("Debes iniciar sesion para comentar.");
      return;
    }

    const user = JSON.parse(userStr);
    setIsSubmittingComment(true);

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          content: comment,
        }),
      });

      if (!response.ok) {
        let backendMessage = "Error publicando comentario";
        try {
          const errorData = await response.json();
          backendMessage = errorData?.message || errorData?.error || backendMessage;
        } catch {}
        throw new Error(backendMessage);
      }

      setNewComment("");

      const commentsResponse = await fetch(`http://localhost:3001/api/projects/${id}/comments`);
      if (commentsResponse.ok) {
        const latestComments = await commentsResponse.json();
        setComments(Array.isArray(latestComments) ? latestComments : []);
      }
    } catch (error) {
      console.error("Error comentando:", error);
      alert(error.message || "No se pudo publicar el comentario.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSendMessageToAuthor = async () => {
    if (!currentUser?.user_id || !videoData?.user_id) return;
    if (!canInteractWithUser(currentUser.user_id, videoData.user_id)) return;

    try {
      const response = await fetch("http://localhost:3001/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_one_id: currentUser.user_id,
          user_two_id: videoData.user_id,
        }),
      });

      if (!response.ok) throw new Error("No se pudo crear la conversación");
      const data = await response.json();
      const conversationId = data?.conversation_id;
      if (!conversationId) throw new Error("Conversación inválida");

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error iniciando chat:", error);
      alert("No se pudo abrir el chat.");
    }
  };

  const refreshAuthorFollowState = async () => {
    if (!videoData?.user_id) return;

    const [publicUser, followStatus] = await Promise.all([
      fetchPublicUser(videoData.user_id),
      currentUser?.user_id && canInteractWithUser(currentUser.user_id, videoData.user_id)
        ? fetchFollowStatus(videoData.user_id, currentUser.user_id)
        : Promise.resolve({ is_following: false, is_self: true }),
    ]);

    setAuthorData(publicUser);
    setFollowState({
      isFollowing: Boolean(followStatus?.is_following),
      isSelf: Boolean(followStatus?.is_self),
      isLoaded: true,
    });
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.user_id || !videoData?.user_id) return;
    if (!canInteractWithUser(currentUser.user_id, videoData.user_id)) return;

    setIsFollowActionLoading(true);

    try {
      if (followState.isFollowing) {
        await unfollowUser(videoData.user_id, currentUser.user_id);
      } else {
        await followUser(videoData.user_id, currentUser.user_id);
      }

      await refreshAuthorFollowState();
    } catch (error) {
      console.error("Error actualizando seguimiento:", error);
      alert(error.message || "No se pudo actualizar el seguimiento.");
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  return (
    <div className="video-detail-page">
      <Header />

      <div className={`video-layout ${isTheaterMode ? "theater" : "normal"}`}>
        <div className="video-player-section">
          {videoData?.archive_type === "AUDIO" ? (
            <div className="audio-player-panel">
              {videoData?.thumbnail_url ? (
                <div
                  className="audio-cover-stage"
                  style={{ backgroundImage: `url(http://localhost:3001${videoData.thumbnail_url})` }}
                >
                  <div className="audio-cover-backdrop" />
                  <div className="audio-center-overlay">
                    <button
                      type="button"
                      className="audio-play-btn"
                      onClick={toggleAudioPlayback}
                      disabled={!isWaveReady}
                      aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
                    >
                      {isPlaying ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="8,5 19,12 8,19" />
                        </svg>
                      )}
                    </button>
                    <div className="audio-waveform-shell">
                      <div ref={waveformRef} className="audio-waveform" aria-label="Waveform del audio" />
                      {!isWaveReady && <div className="audio-waveform-empty">Cargando waveform...</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="audio-waveform-shell">
                  <button
                    type="button"
                    className="audio-play-btn"
                    onClick={toggleAudioPlayback}
                    disabled={!isWaveReady}
                    aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
                  >
                    {isPlaying ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="8,5 19,12 8,19" />
                      </svg>
                    )}
                  </button>
                  <div ref={waveformRef} className="audio-waveform" aria-label="Waveform del audio" />
                  {!isWaveReady && <div className="audio-waveform-empty">Cargando waveform...</div>}
                </div>
              )}
            </div>
          ) : (
            <>
              <video controls poster={videoData?.thumbnail_url ? `http://localhost:3001${videoData.thumbnail_url}` : getImagePath("bateriaportada.png")} className="video-element">
                {videoData?.url_archive && <source src={`http://localhost:3001${videoData.url_archive}`} />}
              </video>
              <button className="mode-toggle-btn" onClick={() => setIsTheaterMode(!isTheaterMode)}>
                {isTheaterMode ? "Modo normal" : "Modo cine"}
              </button>
            </>
          )}
        </div>

        <div className="video-bottom-layout">
          <div className="video-info-column">
            <h1 className="video-title">{videoData?.title || "Titulo del video"}</h1>

            <div className="video-author-row">
              <div className="author-info">
                <img
                  src={authorData?.profile_picture_url ? `http://localhost:3001${authorData.profile_picture_url}` : (videoData?.profile_picture_url ? `http://localhost:3001${videoData.profile_picture_url}` : getImagePath("gatoportada.jpg"))}
                  alt="Avatar"
                  className="author-avatar"
                  style={{ cursor: "pointer" }}
                  onClick={goToAuthorProfile}
                />
                <div className="author-text">
                  <span className="author-name" style={{ cursor: "pointer" }} onClick={goToAuthorProfile}>
                    {authorData?.username || videoData?.username || "Usuario"}
                  </span>
                  <span className="author-followers">
                    {Number(authorData?.followers_count || 0)} seguidores
                  </span>
                </div>
                {followState.isLoaded && canInteractWithUser(currentUser?.user_id, videoData?.user_id) && (
                  <button
                    className={`follow-btn ${followState.isFollowing ? "following" : ""}`}
                    onClick={handleFollowToggle}
                    disabled={isFollowActionLoading}
                  >
                    {isFollowActionLoading ? "Procesando..." : followState.isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                )}
              </div>

              <div className="video-actions">
                <button className="action-icon-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                </button>
                <button className="action-icon-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                </button>
                <button className="action-text-btn">Compartir</button>
                {canInteractWithUser(currentUser?.user_id, videoData?.user_id) && (
                  <button className="action-text-btn" onClick={handleSendMessageToAuthor}>
                    Mandar un mensaje
                  </button>
                )}
              </div>
            </div>

            <div className={`video-description-box ${isDescriptionExpanded ? "expanded" : ""}`}>
              <button
                className="video-description-toggle"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
              >
                {isDescriptionExpanded ? "Mostrar menos" : "Mostrar mas"}
              </button>
              <p className="video-upload-date">
                Subido el {formatUploadDate(videoData?.creation_date)}
              </p>
              <p className="video-description-text">
                {videoData?.description || "Sin descripcion"}
              </p>
              <div className="video-tags-row">
                {(videoData?.tags || []).map((tag) => (
                  <span key={tag} className="video-tag-chip">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="comments-section">
              <h3 className="comments-title">Comentarios ({comments.length})</h3>
              <div className="comment-compose-row">
                <input
                  type="text"
                  className="comment-compose-input"
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <button
                  className="comment-send-btn"
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || newComment.trim().length === 0}
                >
                  {isSubmittingComment ? "Enviando..." : "Comentar"}
                </button>
              </div>

              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.comment_id} className="comment-item">
                    <img
                      src={comment.profile_picture_url ? `http://localhost:3001${comment.profile_picture_url}` : getImagePath("gatoportada.jpg")}
                      alt="avatar"
                      className="comment-item-avatar"
                    />
                    <div className="comment-item-body">
                      <span className="comment-item-author">{comment.username}</span>
                      <p className="comment-item-text">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="video-recommendations-column">
            {recommendations.map((r) => (
              <div className="rec-card" key={r.id}>
                <div className="rec-thumbnail">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                </div>
                <div className="rec-info">
                  <span className="rec-title">{r.title}</span>
                  <span className="rec-user">{r.user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MessagesWidget />
    </div>
  );
}
