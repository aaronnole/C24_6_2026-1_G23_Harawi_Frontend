import "./UpgradeOverlay.css";

const plans = [
  {
    name: "Gratuito",
    storage: "4GB",
    minutes: "180",
    ads: "Sí",
    featured: false,
  },
  {
    name: "Pro",
    storage: "20GB",
    minutes: "600",
    ads: "No",
    featured: true,
  },
  {
    name: "Pro +",
    storage: "50GB",
    minutes: "Ilimitado",
    ads: "No",
    featured: false,
  },
];

const benefits = [
  {
    label: "Almacenamiento",
    values: ["4GB", "20GB", "50GB"],
  },
  {
    label: "Minutos de audio/video",
    values: ["180", "600", "Ilimitado"],
  },
  {
    label: "Anuncios",
    values: ["Sí", "No", "No"],
  },
];

export default function UpgradeOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="upgrade-overlay-backdrop" role="presentation" onClick={onClose}>
      <div
        className="upgrade-overlay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-overlay-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upgrade-overlay-header">
          <div>
            <p className="upgrade-overlay-eyebrow">Planes</p>
            <h2 id="upgrade-overlay-title" className="upgrade-overlay-title">
              Elige el plan que mejor acompaña tu flujo
            </h2>
          </div>
          <button type="button" className="upgrade-overlay-close" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </div>

        <p className="upgrade-overlay-copy">
          Compara los beneficios principales y decide cuánto espacio y capacidad necesitas para tu contenido.
        </p>

        <div className="upgrade-table-wrap">
          <table className="upgrade-table">
            <thead>
              <tr>
                <th scope="col" className="upgrade-table-sticky">Beneficio</th>
                {plans.map((plan) => (
                  <th key={plan.name} scope="col" className={plan.featured ? "featured" : ""}>
                    <span className="upgrade-plan-name">{plan.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benefits.map((benefit) => (
                <tr key={benefit.label}>
                  <th scope="row" className="upgrade-table-sticky">
                    {benefit.label}
                  </th>
                  {benefit.values.map((value, index) => (
                    <td key={`${benefit.label}-${plans[index].name}`} className={plans[index].featured ? "featured" : ""}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="upgrade-overlay-footnote">
          <span>Pro recomendado para creadores activos.</span>
          <span>Pro + pensado para equipos y uso intensivo.</span>
        </div>

        <div className="upgrade-overlay-actions">
          <button type="button" className="upgrade-secondary-btn" onClick={onClose}>
            Tal vez después
          </button>
          <button type="button" className="upgrade-primary-btn" onClick={onClose}>
            Elegir Pro
          </button>
        </div>
      </div>
    </div>
  );
}
