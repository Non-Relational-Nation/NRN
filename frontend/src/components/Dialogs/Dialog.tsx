import { useRef, useEffect } from "react";
import "./styles.css"

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

    return (
    <dialog ref={dialogRef} onClose={onClose} id="dialog">
      <section id="dialog-header">
        {title && <h2 id="dialog-title">{title}</h2>}
        <button id="dialog-close" onClick={onClose}>
          &times;
        </button>
      </section>
      <div id="dialog-content">{children}</div>
    </dialog>
  );
}

export default Dialog;
