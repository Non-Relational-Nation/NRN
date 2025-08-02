import { useState, useRef } from "react";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import { useQuery } from "@tanstack/react-query";
import { createPost } from "../../api/posts";
import removeIcon from "../../assets/remove.svg";
import attachIcon from "../../assets/attachment.svg";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refetch, isFetching, error } = useQuery({
    queryKey: ["create-post"],
    queryFn: () => createPost({ files, content }),
    enabled: false,
    retry: false,
    gcTime: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = () => {
    console.log("Post content:", content);
    console.log("Files:", files);
    refetch();
  };

  return (
    <Layout loading={isFetching} error={error}>
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
    </Layout>
  );
}
