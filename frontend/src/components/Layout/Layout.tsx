import "./styles.css";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader/Loader";
import ErrorPage from "../../pages/ErrorPage/ErrorPage";
import homeIcon from "../../assets/home.svg";
import searchIcon from "../../assets/search.svg";
import addPostIcon from "../../assets/add-post.svg";
import userIcon from "../../assets/user.svg";

interface LayoutProps {
  children?: ReactNode;
  loading?: boolean;
  error?: Error | null;
}

function Layout({ children, loading = false, error = null }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div id="layout">
      <header id="header" className="fancy-font">Non-Relational Nation</header>
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
          <button className="button nav-button" id="first-button" onClick={() => navigate("/")}>
            <img src={homeIcon} alt="Home" width={20} height={20}/>
          </button>
          <button className="button nav-button" onClick={() => navigate("/search")}>
            <img src={searchIcon} alt="Search" width={20} height={20}/>
          </button>
          <button
            className="button nav-button"
            onClick={() => navigate("/create-post")}
          >
            <img src={addPostIcon} alt="Add Post" width={20} height={20}/>
          </button>
          <button className="button nav-button" onClick={() => navigate("/profile")}>
            <img src={userIcon} alt="Profile" width={20} height={20}/>
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;
