interface ErrorPageProps {
  errorMessage?: string;
}

export default function ErrorPage({
  errorMessage = "An unknown error has occurred",
}: ErrorPageProps) {
  return (
    <>
      <h1>An error has occurred</h1>
      <h2>{errorMessage}</h2>
    </>
  );
}
