import "./styles.css";

import Layout from "../../components/Layout/Layout";
import PostList from "../../components/Posts/PostList";

export default function Feed() {
  return (
    <Layout>
      <PostList></PostList>
    </Layout>
  );
}
