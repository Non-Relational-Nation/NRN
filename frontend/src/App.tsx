import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Page1 from "./pages/Page1/Page1";
import Page2 from "./pages/Page2/Page2";
import NotFound from "./pages/NotFound/NotFound";
import Login from "./pages/Login/Login";
import { useEffect } from "react";
import Callback from "./pages/Login/Callback";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/^\//, "");

    if (
      !sessionStorage.getItem("JWT_TOKEN") &&
      !["login", "login/callback"].includes(path)
    ) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Page1 />} />
      <Route path="/login/callback" element={<Callback />} />
      <Route path="/login" element={<Login />} />
      <Route path="/page2" element={<Page2 />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
