<script src="http://localhost:8097"></script>
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Feed from './pages/Feed/Feed';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Header from './components/Header/Header';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
