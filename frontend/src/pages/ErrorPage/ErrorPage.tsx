interface ErrorPageProps {
  errorMessage?: string;
}

export default function ErrorPage({
  errorMessage = "Something went wrong. Please try again.",
}: ErrorPageProps) {
  return (
    <>
      <h1>An error has occurred</h1>
      <h2>{errorMessage}</h2>
    </>
  );
}
