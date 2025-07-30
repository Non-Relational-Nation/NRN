<script src="http://localhost:8097"></script>
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useAppStore } from '../../store';

export default function Settings() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const menuItems = [
    { label: 'Notifications', action: () => {} },
    { label: 'Help', action: () => {} },
    { label: 'Log out', action: () => setModalOpen(true), color: 'accent' },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-primary mb-6">Settings</h2>
      <div className="bg-card rounded-xl shadow-md divide-y divide-gray-200">
        {menuItems.map(({ label, action, color }) => (
          <div
            key={label}
            onClick={action}
            className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
              color === 'accent' ? `text-accent font-semibold` : `text-gray-700`
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <ConfirmModal
        isOpen={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

