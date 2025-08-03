import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import NotFound from "./pages/NotFound/NotFound";
import Login from "./pages/Login/Login";
import { useEffect } from "react";
import Callback from "./pages/Login/Callback";
import Feed from "./pages/Feed/Feed";
import Search from "./pages/Search/Search";
import Profile from "./pages/Profile/Profile";
import CreatePost from "./pages/CreatePost/CreatePost";
import EditProfile from "./pages/EditProfile/EditProfile";

// NRN Social Media App
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
      <Route path="/" element={<Feed />} />
      <Route path="/login/callback" element={<Callback />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/:user?" element={<Profile />} />
      <Route path="/search" element={<Search />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
