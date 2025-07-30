<script src="http://localhost:8097"></script>
import { Dialog } from '@headlessui/react';

export default function ConfirmModal({ isOpen, onConfirm, onCancel }: any) {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/30 px-4">
        <Dialog.Panel className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg">
          <Dialog.Title className="text-lg font-bold text-primary mb-2">
            Confirm Logout
          </Dialog.Title>
          <p className="text-secondary mb-4">Are you sure you want to log out?</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="text-gray-500 hover:underline">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="text-white bg-accent hover:bg-accent/90 font-semibold px-4 py-2 rounded-full"
            >
              Log out
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

