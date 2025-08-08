import { useState, useRef } from "react";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import { useMutation } from "@tanstack/react-query";
import { createPost } from "../../api/posts";
import removeIcon from "../../assets/remove.svg";
import attachIcon from "../../assets/attachment.svg";
import { useNavigate } from "react-router-dom";
import ErrorDialog from "../../components/Dialogs/ErrorDialog";

export default function CreatePost() {
  const navigate = useNavigate();
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => navigate("/profile"),
    onError: (err: Error) => setErrorDialogMessage(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = Array.from(fileList).filter((file) => file.size <= 5 * 1024 * 1024);
    if (files.length !== fileList.length) {
      setErrorDialogMessage("File size exceeds 5MB limit");
    }
    setFiles((prev) => [...prev, ...files]);
  };
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!content && !files.length) {
      setErrorDialogMessage("Either content or attachments are required");
    } else {
      createPostMutation.mutate({ content, files });
    }
  };

  return (
    <Layout>
      <section id="create-post-container">
        <h2 id="create-post-title">Create Post</h2>
        <textarea
          id="create-post-textarea"
          placeholder="Post content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div id="attachment-section">
          <div id="file-input-section">
            <button
              className="button"
              id="add-files-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Add Attachments
              <img
                title="Add attachment"
                src={attachIcon}
                width={20}
                height={20}
              />
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              id="file-input-button"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              
            />
          </div>
          <div id="file-list">
            {files.length > 0 ? (
              files.map((file, index) => (
                <div key={index} id="file-item">
                  <span>{file.name}</span>
                  <img
                    title="Remove attachment"
                    className="button"
                    src={removeIcon}
                    onClick={() => handleRemoveFile(index)}
                    width={20}
                    height={20}
                  />
                </div>
              ))
            ) : (
              <span id="no-attachments-text">
                You have not added any attachments
              </span>
            )}
          </div>
        </div>

        <button
          id="create-post-button"
          className="button"
          onClick={handleCreatePost}
        >
          Create Post
        </button>
      </section>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </Layout>
  );
}
