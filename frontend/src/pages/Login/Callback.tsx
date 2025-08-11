import "./styles.css"
import { handleOAuthCallback } from "../../api/login";
import Loader from "../../components/Loader/Loader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Callback() {
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await handleOAuthCallback();
        navigate("/");
      } catch {
        setError(true);
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div className="login-card card">
        <h2 className="login-heading" id="login-failed-heading">Login failed</h2>
        <button className="filled-button" id="return-button" onClick={() => navigate("/login")}>Return to Login</button>
      </div>
    );
  } else {
    return <Loader />;
  }
}

export default Callback;
