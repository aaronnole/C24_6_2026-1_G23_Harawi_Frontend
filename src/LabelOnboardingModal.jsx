import React, { useState } from 'react';
import './OnboardingModal.css';

export default function LabelOnboardingModal({ user, onComplete }) {
  const [formData, setFormData] = useState({
    label_name: '',
    ruc: '',
    company_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/record-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          ...formData
        })
      });

      if (response.ok) {
        onComplete();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al guardar los datos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Información del Sello</h2>
          <p>Por favor completa los datos de tu sello discográfico para continuar.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="onboarding-form">
          {error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <div className="form-group">
            <label htmlFor="label_name">Nombre del sello</label>
            <input 
              id="label_name"
              type="text" 
              required 
              value={formData.label_name}
              onChange={(e) => setFormData({...formData, label_name: e.target.value})}
              placeholder="Ej. Harawi Records"
            />
          </div>

          <div className="form-group">
            <label htmlFor="company_name">Razón Social</label>
            <input 
              id="company_name"
              type="text" 
              required 
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              placeholder="Ej. Harawi Records S.A.C."
            />
          </div>

          <div className="form-group">
            <label htmlFor="ruc">RUC</label>
            <input 
              id="ruc"
              type="text" 
              required 
              value={formData.ruc}
              onChange={(e) => setFormData({...formData, ruc: e.target.value})}
              placeholder="Ej. 20123456789"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Completar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
