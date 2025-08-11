import "./styles.css";
import { type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../Loader/Loader";
import ErrorPage from "../../pages/ErrorPage/ErrorPage";
import homeIcon from "../../assets/home.svg";
import searchIcon from "../../assets/search.svg";
import addPostIcon from "../../assets/add-post.svg";
import userIcon from "../../assets/user.svg";
import { logout } from "../../util/logout";

interface LayoutProps {
  children?: ReactNode;
  loading?: boolean;
  error?: Error | null;
}

function Layout({ children, loading = false, error = null }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div id="layout">
      <header id="header">
        <section className="logo">
          <p className="logo-icon">nrn</p>
        </section>
        <button
          type="button"
          className="button"
          onClick={() => logout()}
        >
          Sign out
        </button>
      </header>
      <main id="content">
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorPage errorMessage={error.message} />
        ) : (
          children
        )}
      </main>
      <footer id="footer">
        <nav id="navbar">
          <button
            title="Home"
            className={`nav-button${
              location.pathname === "/" ? " nav-button-active" : ""
            }`}
            onClick={() => navigate("/")}
          >
            <img
              src={homeIcon}
              alt="Home"
              width={20}
              height={20}
            />
          </button>
          <button
            title="Search"
            className={`nav-button${
              location.pathname === "/search" ? " nav-button-active" : ""
            }`}
            onClick={() => navigate("/search")}
          >
            <img
              src={searchIcon}
              alt="Search"
              width={20}
              height={20}
            />
          </button>
          <button
            title="Create Post"
            className={`nav-button${
              location.pathname === "/create-post" ? " nav-button-active" : ""
            }`}
            onClick={() => navigate("/create-post")}
          >
            <img
              src={addPostIcon}
              alt="Add Post"
              width={20}
              height={20}
            />
          </button>
          <button
            title="My Profile"
            className={`nav-button${
              location.pathname.startsWith("/profile")
                ? " nav-button-active"
                : ""
            }`}
            onClick={() => navigate("/profile")}
          >
            <img
              src={userIcon}
              alt="Profile"
              width={20}
              height={20}
            />
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;
