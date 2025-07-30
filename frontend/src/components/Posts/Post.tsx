import "./styles.css";

export default function Post() {
  return (
    <article id="post">
      <header id="post-header">
        <span>Posted by User123</span>
        <span>14:03</span>
      </header>
      <section id="post-content">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>
      <footer id="post-footer">
        <button>Like</button>
        <span>12 Likes</span>
      </footer>
    </article>
  );
}
