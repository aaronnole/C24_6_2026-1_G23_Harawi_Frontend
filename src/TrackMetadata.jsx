import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import "./TrackMetadata.css";
import { buildApiUrl } from "./utils/api";
import { resolveMediaUrl } from "./utils/mediaUrl";

const createVideoThumbnail = (file) => (
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const finishWithError = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const captureFrame = () => {
      if (settled) return;

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        finishWithError(new Error("No se pudo preparar la portada del video."));
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          finishWithError(new Error("No se pudo generar la portada del video."));
          return;
        }

        settled = true;
        cleanup();
        const baseName = file.name.split(".").slice(0, -1).join(".") || "video";
        resolve(new File([blob], `${baseName}-frame.jpg`, { type: "image/jpeg" }));
      }, "image/jpeg", 0.86);
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("error", () => finishWithError(new Error("No se pudo leer el video para generar portada.")), { once: true });
    video.addEventListener("loadedmetadata", () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > 1
        ? Math.min(1, video.duration * 0.1)
        : 0;

      if (targetTime === 0) {
        video.addEventListener("loadeddata", captureFrame, { once: true });
        return;
      }

      video.currentTime = targetTime;
    }, { once: true });
    video.addEventListener("seeked", captureFrame, { once: true });
    video.src = objectUrl;
  })
);

export default function TrackMetadata() {
  const navigate = useNavigate();
  const location = useLocation();
  const editProjectId = location.state?.editProjectId;
  const isEditMode = Boolean(editProjectId);
  const [archiveFile, setArchiveFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [mainArtists, setMainArtists] = useState("");
  const [collaboratorQuery, setCollaboratorQuery] = useState("");
  const [collaboratorOptions, setCollaboratorOptions] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const thumbnailInputRef = useRef(null);
  const uploadInProgressRef = useRef(false);
  const generatedThumbnailPreviewRef = useRef(null);
  const thumbnailGenerationIdRef = useRef(0);

  // Generos
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  // Etiquetas
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    // Cargar archivo desde Upload
    if (!isEditMode && location.state && location.state.archiveFile) {
      setArchiveFile(location.state.archiveFile);
      const name = location.state.archiveFile.name.split(".").slice(0, -1).join(".");
      setTitle(name);
    }

    // Cargar generos desde el backend
    fetch(buildApiUrl("/genres"))
      .then((res) => res.json())
      .then((data) => setGenres(data))
      .catch((err) => console.error("Error cargando generos:", err));

    if (user) {
      setMainArtists(user?.username || "");
    }

    if (!isEditMode || !user?.user_id) {
      return;
    }

    let isMounted = true;
    setIsLoadingMetadata(true);

    fetch(buildApiUrl(`/projects/${editProjectId}/metadata?user_id=${user.user_id}`))
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la metadata del track.");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setTitle(data?.title || "");
        setDescription(data?.description || "");
        setPrivacy(data?.visibility === "PRIVATE" ? "private" : "public");
        setSelectedGenre(data?.genre_id ? String(data.genre_id) : "");
        setTags(Array.isArray(data?.tags) ? data.tags : []);
        setSelectedCollaborators(
          Array.isArray(data?.collaborators)
            ? data.collaborators
                .filter((item) => item?.user_id)
                .map((item) => ({
                  user_id: item.user_id,
                  username: item.username,
                  status: item.status,
                }))
            : []
        );
        setThumbnailPreview(data?.thumbnail_url ? resolveMediaUrl(data.thumbnail_url) : null);
      })
      .catch((error) => {
        console.error("Error cargando metadata:", error);
        alert(error.message || "No se pudo cargar la metadata del track.");
        navigate("/profile");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMetadata(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [editProjectId, isEditMode, location.state, navigate]);

  useEffect(() => {
    if (isEditMode || !archiveFile || !archiveFile.type.startsWith("video/") || thumbnailFile) {
      return undefined;
    }

    let isMounted = true;
    const generationId = thumbnailGenerationIdRef.current + 1;
    thumbnailGenerationIdRef.current = generationId;
    setIsGeneratingThumbnail(true);

    createVideoThumbnail(archiveFile)
      .then((file) => {
        if (!isMounted || thumbnailGenerationIdRef.current !== generationId) return;

        const previewUrl = URL.createObjectURL(file);
        if (generatedThumbnailPreviewRef.current) {
          URL.revokeObjectURL(generatedThumbnailPreviewRef.current);
        }

        generatedThumbnailPreviewRef.current = previewUrl;
        setThumbnailFile(file);
        setThumbnailPreview(previewUrl);
      })
      .catch((error) => {
        if (isMounted) {
          console.warn("No se pudo generar portada automatica del video:", error);
        }
      })
      .finally(() => {
        if (isMounted && thumbnailGenerationIdRef.current === generationId) {
          setIsGeneratingThumbnail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [archiveFile, isEditMode, thumbnailFile]);

  useEffect(() => () => {
    if (generatedThumbnailPreviewRef.current) {
      URL.revokeObjectURL(generatedThumbnailPreviewRef.current);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return undefined;

    const user = JSON.parse(userStr);
    const controller = new AbortController();
    const normalizedQuery = collaboratorQuery.trim();

    const timeoutId = setTimeout(async () => {
      setIsLoadingCollaborators(true);
      try {
        const params = new URLSearchParams({
          limit: "20",
        });

        if (normalizedQuery) {
          params.append("search", normalizedQuery);
        }

        const response = await fetch(buildApiUrl(`/users/${user.user_id}/followers?${params.toString()}`), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar tus seguidores.");
        }

        const data = await response.json();
        const selectedIds = new Set(selectedCollaborators.map((item) => item.user_id));
        setCollaboratorOptions(
          Array.isArray(data) ? data.filter((item) => !selectedIds.has(item.user_id)) : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error cargando seguidores:", error);
          setCollaboratorOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCollaborators(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [collaboratorQuery, selectedCollaborators]);

  const handleThumbnailClick = () => {
    if (isEditMode) return;
    thumbnailInputRef.current?.click();
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      thumbnailGenerationIdRef.current += 1;
      if (generatedThumbnailPreviewRef.current) {
        URL.revokeObjectURL(generatedThumbnailPreviewRef.current);
        generatedThumbnailPreviewRef.current = null;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      alert("Por favor selecciona una imagen valida.");
    }
  };

  // Logica de etiquetas
  const addTag = () => {
    const cleaned = tagInput.trim().replace(/^#+/, "").toLowerCase();
    if (!cleaned) return;
    if (tags.length >= 10) {
      alert("Maximo 10 etiquetas por archivo.");
      return;
    }
    if (tags.includes(cleaned)) {
      setTagInput("");
      return;
    }
    setTags([...tags, cleaned]);
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const addCollaborator = (collaborator) => {
    setSelectedCollaborators((current) => {
      if (current.some((item) => item.user_id === collaborator.user_id)) {
        return current;
      }

      return [...current, collaborator];
    });
    setCollaboratorQuery("");
    setCollaboratorOptions([]);
  };

  const removeCollaborator = (collaboratorUserId) => {
    setSelectedCollaborators((current) =>
      current.filter((item) => item.user_id !== collaboratorUserId)
    );
  };

  const handleFinish = async () => {
    if (uploadInProgressRef.current) return;

    if (!isEditMode && !archiveFile) {
      alert("No se ha seleccionado ningun archivo musical para subir.");
      navigate("/upload");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("Debes iniciar sesion para subir archivos.");
      return;
    }
    const user = JSON.parse(userStr);
    const collaboratorIds = selectedCollaborators.map((item) => item.user_id);

    uploadInProgressRef.current = true;
    setIsUploading(true);
    try {
      let response;

      if (isEditMode) {
        response = await fetch(buildApiUrl(`/projects/${editProjectId}/metadata`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_id,
            title,
            description,
            privacy,
            genre_id: selectedGenre || null,
            tags,
            collaborators: collaboratorIds,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("archive", archiveFile);
        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
        formData.append("user_id", user.user_id);
        formData.append("archive_name", title || archiveFile.name);
        formData.append("description", description);
        formData.append("privacy", privacy);
        if (selectedGenre) formData.append("genre_id", selectedGenre);
        if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
        if (collaboratorIds.length > 0) formData.append("collaborators", JSON.stringify(collaboratorIds));

        response = await fetch(buildApiUrl("/musical-archives"), {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        let backendMessage = "Error al subir el archivo";
        try {
          const errorData = await response.json();
          backendMessage = errorData?.error || errorData?.message || backendMessage;
        } catch {
          const text = await response.text();
          if (text) backendMessage = text;
        }
        throw new Error(backendMessage);
      }

      alert(isEditMode ? "Metadata actualizada exitosamente." : "Archivo subido exitosamente.");
      navigate("/profile");
    } catch (error) {
      console.error("Error subiendo el archivo:", error);
      alert(`Hubo un error al subir tu archivo: ${error.message}`);
      uploadInProgressRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <div className="metadata-page">
      <Header />

      <main className="metadata-container">
        {isLoadingMetadata ? (
          <div className="selected-file-info">Cargando metadata del track...</div>
        ) : null}
        <div className="metadata-columns">
          <div className="cover-upload-section">
            <div
              className="cover-square"
              onClick={handleThumbnailClick}
              style={{ cursor: "pointer", overflow: "hidden", position: "relative" }}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="cover-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <p>Anadir portada</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={thumbnailInputRef}
              onChange={handleThumbnailChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            {isEditMode && (
              <div className="selected-file-info">
                <strong>Modo edicion:</strong><br />
                Por ahora puedes editar metadata, etiquetas, privacidad y colaboradores.
              </div>
            )}
            {!isEditMode && archiveFile && (
              <div className="selected-file-info">
                <strong>Archivo seleccionado:</strong><br />
                {archiveFile.name} ({(archiveFile.size / (1024 * 1024)).toFixed(2)} MB)
                {isGeneratingThumbnail && archiveFile.type.startsWith("video/") ? (
                  <>
                    <br />
                    Generando portada automatica...
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="metadata-form-section">
            <div className="form-group">
              <label>Titulo de la pista (o video)</label>
              <input
                type="text"
                placeholder="Ingresa un titulo..."
                className="meta-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Artista(s) principal(es)</label>
              <input
                type="text"
                placeholder="Nombre de usuario"
                className="meta-input"
                value={mainArtists}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Genero</label>
              <select
                className="meta-input select-input"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="">Selecciona un genero...</option>
                {genres.map((g) => (
                  <option key={g.genre_id} value={g.genre_id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Etiquetas</label>
              <div className="tags-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag-bubble">
                    #{tag}
                    <button
                      className="tag-remove-btn"
                      onClick={() => removeTag(tag)}
                      aria-label={`Eliminar etiqueta ${tag}`}
                    >x</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-input"
                  placeholder={tags.length === 0 ? "Escribe una etiqueta y presiona Enter..." : "Agregar mas..."}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                />
              </div>
              <p className="tags-hint">Presiona <kbd>Enter</kbd> o <kbd>,</kbd> para anadir. Maximo 10 etiquetas.</p>
            </div>

            <div className="form-group">
              <label>Descripcion</label>
              <textarea
                placeholder="Escribe algo sobre este archivo..."
                className="meta-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label>Colaboradores</label>
              <div className="collaborator-picker">
                <div className="selected-collaborators">
                  {selectedCollaborators.map((collaborator) => (
                    <span key={collaborator.user_id} className="tag-bubble collaborator-bubble">
                      @{collaborator.username}
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => removeCollaborator(collaborator.user_id)}
                        aria-label={`Eliminar colaborador ${collaborator.username}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Busca entre tus seguidores"
                  className="meta-input"
                  value={collaboratorQuery}
                  onChange={(e) => setCollaboratorQuery(e.target.value)}
                />

                {isLoadingCollaborators ? (
                  <div className="collaborator-results collaborator-results-muted">
                    Buscando seguidores...
                  </div>
                ) : collaboratorOptions.length > 0 ? (
                  <div className="collaborator-results">
                    {collaboratorOptions.map((collaborator) => (
                      <button
                        key={collaborator.user_id}
                        type="button"
                        className="collaborator-result-btn"
                        onClick={() => addCollaborator(collaborator)}
                      >
                        <span>@{collaborator.username}</span>
                      </button>
                    ))}
                  </div>
                ) : collaboratorQuery.trim() ? (
                  <div className="collaborator-results collaborator-results-muted">
                    No se encontraron seguidores con ese nombre.
                  </div>
                ) : null}
              </div>
              <p className="tags-hint">Solo puedes agregar usuarios que ya te siguen. Al guardar, los colaboradores quedaran en estado pendiente.</p>
            </div>

            <div className="privacy-section">
              <p className="privacy-label">Privacidad</p>
              <div className="privacy-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === "public"}
                    onChange={(e) => setPrivacy(e.target.value)}
                  />
                  <span>Publico</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === "private"}
                    onChange={(e) => setPrivacy(e.target.value)}
                  />
                  <span>Privado</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          className="nav-arrow-btn"
          onClick={handleFinish}
          aria-label="Finalizar"
          disabled={isUploading || isLoadingMetadata}
          style={{ opacity: isUploading || isLoadingMetadata ? 0.5 : 1 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </button>
      </main>
    </div>
  );
}
