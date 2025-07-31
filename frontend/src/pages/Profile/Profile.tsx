import { useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./styles.css";

export default function Profile() {
  const { user } = useParams();
  return (
    <Layout>
      <header>
        <h1>Profile for user {user}</h1>
      </header>
    </Layout>
  );
}
