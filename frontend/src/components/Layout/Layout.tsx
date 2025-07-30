<script src="http://localhost:8097"></script>
import { type ReactNode } from "react";
import Loader from "../Loader/Loader";
import ErrorPage from "../../pages/ErrorPage/ErrorPage";

interface LayoutProps {
  children?: ReactNode;
  loading: boolean;
  error?: Error | null;
}

function Layout({ children, loading, error }: LayoutProps) {
  if (loading) {
    return <Loader />;
  }
  if (error) {
    return <ErrorPage errorMessage={error.message} />;
  }
  return children;
}

export default Layout;
