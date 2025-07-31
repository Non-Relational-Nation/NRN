import "./styles.css"
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main id="not-found-page">
      <section id="not-found-container">
      <h1>Page Not Found</h1>
      <Link to="/">Back to Home Page</Link>
      </section>
    </main>
  );
}
