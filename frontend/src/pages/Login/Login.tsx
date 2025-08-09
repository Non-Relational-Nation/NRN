import "./styles.css";
import googleLogo from "../../assets/google-logo.png";
import cameraIcon from "../../assets/camera.svg";
import { initiateGoogleLogin } from "../../api/login";

function Login() {
  return (
    <main className="card" id="login-card">
      <img src={cameraIcon} alt="Camera" width={40} height={40} />

      <h1 id="login-heading">
        <b>Welcome</b>
        <br />
        to
        <br />
        <b>NRN</b>
      </h1>
      <button
        id="google-login-button"
        className="filled-button"
        onClick={initiateGoogleLogin}
      >
        <img src={googleLogo} alt="Google logo" id="google-logo" />
        <b>Sign in with Google</b>
      </button>
    </main>
  );
}

export default Login;
