import "./styles.css"
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main id="not-found-page">
      <section id="not-found-container" className="card">
      <h1 id="not-found-heading">Page Not Found</h1>
      <Link id="not-found-link" to="/">Back to Home Page</Link>
      </section>
    </main>
  );
}
