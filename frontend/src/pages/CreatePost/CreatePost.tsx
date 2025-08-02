import { useState, useRef } from "react";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import { useQuery } from "@tanstack/react-query";
import { createPost } from "../../api/posts";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refetch, isFetching, error } = useQuery({
    queryKey: ["create-post"],
    queryFn: () => createPost({ files, content }),
    enabled: false,
    retry: false,
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
        <div id="file-input-section">
          <button
            className="button"
            id="add-files-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Add Files
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

        {files.length !== 0 && (
          <div id="file-list">
            <span>Attachments:</span>
            {files.map((file, index) => (
              <div key={index} id="file-item">
                <span>{file.name}</span>
                <button
                  className="button"
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

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
