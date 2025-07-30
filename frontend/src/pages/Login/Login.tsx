<script src="http://localhost:8097"></script>
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-white">
      <div className="w-full max-w-md bg-card p-10 rounded-xl shadow-lg">
        <h1 className="text-5xl font-bold font-display text-primary mb-10 text-center">
          NRN
        </h1>
        <button className="w-full bg-accent text-white py-3 rounded-full text-lg font-semibold hover:bg-accent/90 transition">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}


