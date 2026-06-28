"use client";

import { useState } from "react";
import { Post } from "@/service/types";

interface PostCardProps {
  post: Post;
  isAuthenticated: boolean;
  onLike: (postId: number) => Promise<void>;
}

export default function PostCard({
  post,
  isAuthenticated,
  onLike,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.liked);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLike() {
    if (!isAuthenticated) {
      alert("Você precisa estar autenticado para curtir posts!");
      return;
    }

    setIsLoading(true);
    const previousLiked = liked;
    setLiked(!liked);

    try {
      await onLike(post.id);
    } catch {
      setLiked(previousLiked);
      alert("Erro ao curtir post. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      role="listitem"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        padding: "1.5rem",
        marginBottom: "1rem",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "var(--card-hover)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "var(--card-bg)";
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "0.75rem",
          color: "var(--foreground)",
        }}
      >
        {post.title}
      </h2>

      <p
        style={{
          color: "var(--foreground)",
          opacity: 0.9,
          lineHeight: "1.6",
          marginBottom: "1rem",
        }}
      >
        {post.body}
      </p>

      {/* ── NOVA FEATURE: exibe likes e dislikes do DummyJSON ── */}
      {post.reactions && (
        <div
          data-testid="reactions"
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            color: "var(--foreground)",
            opacity: 0.8,
          }}
        >
          <span data-testid="likes-count">
            👍 {post.reactions.likes} curtidas
          </span>
          <span data-testid="dislikes-count">
            👎 {post.reactions.dislikes} descurtidas
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={handleLike}
          disabled={isLoading}
          style={{
            background: liked ? "var(--secondary)" : "transparent",
            color: liked ? "white" : "var(--foreground)",
            border: `2px solid ${liked ? "var(--secondary)" : "var(--border)"}`,
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>{liked ? "❤️" : "🤍"}</span>
          <span>{isLoading ? "..." : liked ? "Curtido" : "Curtir"}</span>
        </button>
      </div>
    </div>
  );
}
