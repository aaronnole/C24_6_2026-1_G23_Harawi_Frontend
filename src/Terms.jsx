import { Link } from "react-router-dom";
import Header from "./Header";
import "./Terms.css";

export default function Terms() {
  return (
    <div className="terms-page">
      <Header />

      <main className="terms-main">
        <section className="terms-card">
          <p className="terms-eyebrow">Términos y condiciones</p>
          <h1 className="terms-title">Uso básico de Harawi</h1>
          <p className="terms-intro">
            Al usar la plataforma aceptas estas condiciones básicas. Si no estás de acuerdo, por favor no continúes
            con el uso del servicio.
          </p>

          <div className="terms-grid">
            <article className="terms-block">
              <h2>Cuenta y acceso</h2>
              <p>Debes proteger tu cuenta y usar información veraz al registrarte y publicar contenido.</p>
            </article>

            <article className="terms-block">
              <h2>Contenido</h2>
              <p>Solo sube material que te pertenezca o que tengas permiso para usar, compartir y distribuir.</p>
            </article>

            <article className="terms-block">
              <h2>Uso correcto</h2>
              <p>No está permitido usar la plataforma para fraude, acoso, spam, suplantación o actividades ilegales.</p>
            </article>

            <article className="terms-block warning">
              <h2>Derechos de autor</h2>
              <p>
                Harawi no se hace responsable por reclamos, disputas o infracciones de derechos de autor derivados del
                contenido subido por los usuarios. Cada usuario es responsable de contar con las autorizaciones
                correspondientes.
              </p>
            </article>

            <article className="terms-block">
              <h2>Moderación</h2>
              <p>Podemos retirar contenido, limitar funciones o suspender cuentas si detectamos abuso o incumplimientos.</p>
            </article>

            <article className="terms-block">
              <h2>Cambios</h2>
              <p>Estos términos pueden actualizarse. El uso continuo de la plataforma implica aceptar la versión vigente.</p>
            </article>
          </div>

          <div className="terms-footer">
            <p>Este resumen es informativo y no sustituye asesoría legal profesional.</p>
            <Link to="/login" className="terms-back-link">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
