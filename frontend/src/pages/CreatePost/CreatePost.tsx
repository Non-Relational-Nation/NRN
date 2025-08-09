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
  const [file, setFile] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => navigate("/profile"),
    onError: (err: Error) => setErrorDialogMessage(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setFile(Array.from(fileList)[0]);
  };
  const handleRemoveFile = () => {
    setFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!content && !file) {
      setErrorDialogMessage("Either content or attachments are required");
    } else if (content.length > 500) {
      setErrorDialogMessage("Only allowed 500 characters for post content");
    } else {
      createPostMutation.mutate({ content, file: file });
    }
  };

  return (
    <Layout>
      <section id="create-post-container">
        <h2 id="create-post-title">Create Post</h2>
        <section id="create-post-card" className="card">
          <textarea
            id="create-post-textarea"
            placeholder="What's happening in the nation"
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
                {file ? "Change Attachment" : "Add Attachment"}
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
              {file ? (
                <div id="file-item">
                  {file.type.toUpperCase().startsWith("IMAGE") ? (
                    <div className="preview">
                      <img
                        src={URL.createObjectURL(file)}
                        className="media-image preview-file"
                      />
                      <button
                        title="Remove attachment"
                        id="remove-attachment-btn"
                        onClick={handleRemoveFile}
                        type="button"
                      >
                        <img
                          src={removeIcon}
                          alt="Remove"
                          width={20}
                          height={20}
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="preview">
                      <video controls className="media-video preview-file">
                        <source
                          src={URL.createObjectURL(file)}
                          type="video/mp4"
                        />
                        Your browser does not support video.
                      </video>
                      <button
                        title="Remove attachment"
                        id="remove-attachment-btn"
                        onClick={handleRemoveFile}
                        type="button"
                      >
                        <img
                          src={removeIcon}
                          alt="Remove"
                          width={20}
                          height={20}
                        />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span id="no-attachments-text">
                  You have not added an attachment
                </span>
              )}
            </div>
          </div>
          <button
            id="create-post-button"
            className="filled-button"
            onClick={handleCreatePost}
          >
            <b>Create Post</b>
          </button>
        </section>
      </section>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </Layout>
  );
}
