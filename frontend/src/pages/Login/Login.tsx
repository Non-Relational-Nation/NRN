import "./styles.css";
import googleLogo from "../../assets/google-logo.png";
import { initiateGoogleLogin } from "../../api/login";

function Login() {
  return (
    <button id="google-login-button" onClick={initiateGoogleLogin}>
      <img src={googleLogo} alt="Google logo" id="google-logo" />
      Login with Google
    </button>
  );
}

export default Login;
