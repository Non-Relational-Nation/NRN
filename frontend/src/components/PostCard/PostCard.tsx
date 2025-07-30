<script src="http://localhost:8097"></script>
interface PostProps {
  username: string;
  content: string;
  time: string;
}

export default function PostCard({ username, content, time }: PostProps) {
  return (
    <div className="bg-card border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-semibold text-primary">@{username}</span>
        <span className="text-sm text-secondary">{time}</span>
      </div>
      <p className="text-gray-700">{content}</p>
    </div>
  );
}

