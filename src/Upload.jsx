import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "./Upload.css";
import UpgradeOverlay from "./UpgradeOverlay";

export default function Upload() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    navigate("/dashboard");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      navigate("/upload/metadata", { state: { archiveFile: file } });
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-page">
      <Header />
      
      <main className="upload-container">
        {/* Banner de progreso */}
        <div className="upload-status-banner">
          <div className="status-left">
            <div className="status-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div className="status-progress-wrapper">
              <span className="status-text">3% de subidas usado</span>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: '3%' }}></div>
              </div>
              <span className="status-subtext">7 de 180 minutos</span>
            </div>
          </div>
          
          <div className="status-right">
            <div className="pro-badge" onClick={() => setShowUpgradeModal(true)} style={{ cursor: 'pointer' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
               <span className="upgrade-link">Actualiza a Pro</span>
            </div>
            <button className="close-btn" onClick={handleClose} aria-label="Cerrar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </button>
          </div>
        </div>

        <div className="upload-content">
          <h1 className="upload-title">Sube tus archivos de audio o video</h1>
          <p className="upload-description">
            Para obtener la mejor calidad, utiliza WAV, FLAC, AIFF o ALAC. El tamaño máximo del archivo es de 4 GB sin comprimir. <a href="#">Más información.</a>
          </p>

          <div className="drop-zone" onClick={handleDropZoneClick} style={{ cursor: 'pointer' }}>
            <div className="drop-zone-content">
              <div className="upload-main-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <p className="drop-text">Haz clic aquí para seleccionar tu archivo de audio o video</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="audio/*,video/*" 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <button className="nav-arrow-btn" onClick={() => navigate("/upload/metadata")} aria-label="Saltar">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </button>
      </main>
      <UpgradeOverlay isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
