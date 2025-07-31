import "./styles.css";
import googleLogo from "../../assets/google-logo.png";
import { initiateGoogleLogin } from "../../api/login";

function Login() {
  return (
    <main id="login-card">
    <h1 id="login-heading">NRN Login</h1>
    <button id="google-login-button" onClick={initiateGoogleLogin}>
      <img src={googleLogo} alt="Google logo" id="google-logo" />
      Login with Google
    </button></main>
  );
}

export default Login;
