<script src="http://localhost:8097"></script>
import { useEffect } from 'react';
import PostCard from '../../components/PostCard/PostCard';
import { useAppStore } from '../../store';

export default function Feed() {
  const posts = useAppStore(state => state.posts);
  const setPosts = useAppStore(state => state.setPosts);

  useEffect(() => {
    const mockPosts = [
      { id: '1', username: 'john_doe', content: 'Sky is the limit', time: '5m ago' },
      { id: '2', username: 'jane_smith', content: 'Living my best life!', time: '15m ago' },
    ];
    setPosts(mockPosts);
  }, [setPosts]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {posts.map(post => (
        <PostCard key={post.id} {...post} />
      ))}
      <div className="text-center text-secondary mt-8 text-sm font-medium">
        End of Feed
      </div>
    </main>
  );
}


