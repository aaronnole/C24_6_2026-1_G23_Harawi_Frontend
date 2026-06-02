import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import "./TrackMetadata.css";

export default function TrackMetadata() {
  const navigate = useNavigate();
  const location = useLocation();
  const [archiveFile, setArchiveFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [mainArtists, setMainArtists] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [isUploading, setIsUploading] = useState(false);
  const thumbnailInputRef = useRef(null);
  const uploadInProgressRef = useRef(false);

  // Generos
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  // Etiquetas
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    // Cargar archivo desde Upload
    if (location.state && location.state.archiveFile) {
      setArchiveFile(location.state.archiveFile);
      const name = location.state.archiveFile.name.split(".").slice(0, -1).join(".");
      setTitle(name);
    }

    // Cargar generos desde el backend
    fetch("http://localhost:3001/api/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data))
      .catch((err) => console.error("Error cargando generos:", err));

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setMainArtists(user?.username || "");
    }
  }, [location]);

  const handleThumbnailClick = () => {
    thumbnailInputRef.current?.click();
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
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

  const handleFinish = async () => {
    if (uploadInProgressRef.current) return;

    if (!archiveFile) {
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

    uploadInProgressRef.current = true;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("archive", archiveFile);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    formData.append("user_id", user.user_id);
    formData.append("archive_name", title || archiveFile.name);
    formData.append("description", description);
    formData.append("privacy", privacy);
    if (selectedGenre) formData.append("genre_id", selectedGenre);
    if (tags.length > 0) formData.append("tags", JSON.stringify(tags));

    try {
      const response = await fetch("http://localhost:3001/api/musical-archives", {
        method: "POST",
        body: formData,
      });

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

      alert("Archivo subido exitosamente.");
      navigate("/dashboard");
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
            {archiveFile && (
              <div className="selected-file-info">
                <strong>Archivo seleccionado:</strong><br />
                {archiveFile.name} ({(archiveFile.size / (1024 * 1024)).toFixed(2)} MB)
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
          disabled={isUploading}
          style={{ opacity: isUploading ? 0.5 : 1 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </button>
      </main>
    </div>
  );
}
