import React, { useState } from 'react';
import './OnboardingModal.css';
import { buildApiUrl } from "./utils/api";

export default function OnboardingModal({ user, onComplete }) {
  const [formData, setFormData] = useState({
    type_user: user.type_user || 'artist',
    country: '',
    city: '',
    birth_date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/update-profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          ...formData
        })
      });

      if (response.ok) {
        onComplete(formData.type_user);
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>¡Casi listo!</h2>
          <p>Ayúdanos a completar tu perfil para darte la mejor experiencia.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label>Tipo de Usuario</label>
            <div className="role-selector">
              <button
                type="button"
                className={formData.type_user === 'artist' ? 'active' : ''}
                onClick={() => setFormData({ ...formData, type_user: 'artist' })}
              >
                Artista
              </button>
              <button
                type="button"
                className={formData.type_user === 'label' ? 'active' : ''}
                onClick={() => setFormData({ ...formData, type_user: 'label' })}
              >
                Sello Discográfico
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">País</label>
              <input
                id="country"
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Ej. Perú"
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">Ciudad</label>
              <input
                id="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ej. Lima"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="birth_date">Fecha de Nacimiento</label>
            <input
              id="birth_date"
              type="date"
              required
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
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
