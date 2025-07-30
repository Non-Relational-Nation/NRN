import "./styles.css";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader/Loader";
import ErrorPage from "../../pages/ErrorPage/ErrorPage";

interface LayoutProps {
  children?: ReactNode;
  loading: boolean;
  error?: Error | null;
}

function Layout({ children, loading, error }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div id="layout">
      <header id="header">Non-Relational Nation</header>
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
          <button className="nav-button" onClick={() => navigate("/")}>
            Feed
          </button>
          <button className="nav-button" onClick={() => navigate("/search")}>
            Search
          </button>
          <button
            className="nav-button"
            onClick={() => navigate("/create-post")}
          >
            Create post
          </button>
          <button className="nav-button" onClick={() => navigate("/profile")}>
            Profile
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;
