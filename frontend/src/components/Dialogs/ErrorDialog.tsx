import Dialog from "./Dialog";
import "./styles.css";

type ErrorDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
};

function ErrorDialog({ isOpen, onClose, errorMessage }: ErrorDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="An error has occurred">
      <section id="error-section">{errorMessage}</section>
      <section id="button-section">
        <button type="button" onClick={onClose} id="close-button" className="filled-button">
          Close
        </button>
      </section>
    </Dialog>
  );
}

export default ErrorDialog;
