import "./styles.css"

interface ErrorPageProps {
  errorMessage?: string;
}

export default function ErrorPage({
  errorMessage = "An unknown error has occurred",
}: ErrorPageProps) {
  return (
    <section id="error-container">
      <h2>An error has occurred</h2>
      <h4>{errorMessage}</h4>
    </section>
  );
}
