import "./styles.css"

interface ErrorPageProps {
  errorMessage?: string;
}

export default function ErrorPage({
  errorMessage = "An unknown error has occurred",
}: ErrorPageProps) {
  return (
    <section id="error-container">
      <h1>An error has occurred</h1>
      <h2>{errorMessage}</h2>
    </section>
  );
}
