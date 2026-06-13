// src/pages/PostDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiArrowLeft, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import Comment from '../components/blog/Comment';
import RoleBadge from '../components/blog/RoleBadge';

export default function PostDetail() {
  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch post ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/posts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to load post', 'error');
        setLoading(false);
      });
  }, [id]);

  // ── Like post ───────────────────────────────────────────────
  const handleLike = async () => {
    if (!user) { showToast('Please login to like posts 🔐', 'error'); return; }
    const token = user?.token || localStorage.getItem('token');
    try {
      const res = await fetch(`${BASE_URL}/posts/like/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await res.json();
      if (!res.ok) throw new Error();
      setPost((p) => ({ ...p, likes: updated.likes }));
    } catch {
      showToast('Like failed', 'error');
    }
  };

  // ── Submit comment ──────────────────────────────────────────
 const handleSubmitComment = async (e) => {
  e.preventDefault();

  if (!user) {
    showToast("Please login to comment 🔐", "error");
    return;
  }

  if (!commentText.trim()) return;

  setSubmitting(true);

  try {
    const token = user?.token || localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/posts/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: commentText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message);
    }

    // Backend updatedPost return kar raha hai
    setPost(data);
    setComments(data.comments || []);

    setCommentText("");

    showToast("Comment added! 💬", "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to comment", "error");
  } finally {
    setSubmitting(false);
  }
};

  // ── Open chat ───────────────────────────────────────────────
  const handleChatClick = async (otherUserId) => {
    // Assumes you have a /api/chats/conversation endpoint
    try {
      const token = user?.token || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/chats/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: otherUserId }),
      });
      const data = await res.json();
      navigate(`/chat/${data.conversationId || data.data?._id}`);
    } catch {
      showToast('Could not open chat', 'error');
    }
  };

  const isLiked = post?.likes?.some((l) => {
    const lid = typeof l === 'object' ? l._id : l;
    return lid?.toString() === user?._id?.toString();
  });

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-2xl font-bold">Post not found</h2>
        <button onClick={() => navigate('/blog')} className="text-indigo-400 hover:underline">
          ← Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Post card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-8 mb-8"
        >
          {/* Icon + category */}
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">{post.image || '📝'}</div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-white/10">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold overflow-hidden">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  post.author?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">{post.author?.name || 'Unknown'}</div>
                {post.author?.role && <RoleBadge role={post.author.role} />}
              </div>
            </div>

            <span className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>

            {/* Like button */}
            <button
              onClick={handleLike}
              className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                ${isLiked
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-400/40 hover:text-red-400'
                }`}
            >
              <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-red-400' : ''}`} />
              <span className="text-sm font-medium">{post.likes?.length || 0}</span>
            </button>
          </div>

          {/* Excerpt */}
          <p className="text-gray-300 text-lg italic mb-6 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Full content */}
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </motion.div>

        {/* ── Comments section ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            💬 Comments
            <span className="text-sm font-normal text-gray-500">({comments.length})</span>
          </h2>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all resize-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <FiSend className="w-4 h-4" />
                    {submitting ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-gray-400">
              <a href="/auth" className="text-indigo-400 hover:underline">Login</a> to join the discussion
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="text-3xl mb-2">💭</div>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  post={post}
                  onChatClick={handleChatClick}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}