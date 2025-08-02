import "./styles.css";
import googleLogo from "../../assets/google-logo.png";
import { initiateGoogleLogin } from "../../api/login";

function Login() {
  return (
    <main className="login-card">
      <h1 className="fancy-font login-heading">Welcome to NRN</h1>
      <hr />
      <button
        id="google-login-button"
        className="button"
        onClick={initiateGoogleLogin}
      >
        <img src={googleLogo} alt="Google logo" id="google-logo" />
        Login with Google
      </button>
    </main>
  );
}

export default Login;
