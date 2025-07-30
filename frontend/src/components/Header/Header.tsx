<script src="http://localhost:8097"></script>
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 bg-card border-b border-gray-200 shadow-md z-50 px-6 py-4">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Link to="/feed" className="text-2xl font-display font-bold text-primary">
          NRN
        </Link>
        <nav className="space-x-6 text-gray-600">
          <Link to="/profile" className="hover:text-primary transition">Profile</Link>
          <Link to="/settings" className="hover:text-primary transition">Settings</Link>
        </nav>
      </div>
    </header>
  );
}

