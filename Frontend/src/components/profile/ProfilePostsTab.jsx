// src/components/profile/ProfilePostsTab.jsx
// Used inside both FreelancerProfile.jsx and ClientProfile.jsx

import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import PostCard from '../blog/PostCard';
import CreatePostModal from '../blog/CreatePostModal';

export default function ProfilePostsTab({ userId, isOwner = false }) {
  const BASE_URL       = `${import.meta.env.VITE_API_URL}/api`;
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  // ── Fetch user's posts ──────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/posts/user/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPosts(data.data);
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to load posts', 'error');
        setLoading(false);
      });
  }, [userId]);

  const handleLike = async (postId) => {
    if (!user) { showToast('Please login to like 🔐', 'error'); return; }
    const token = user?.token || localStorage.getItem('token');
    try {
      const res     = await fetch(`${BASE_URL}/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await res.json();
      if (!res.ok) throw new Error();
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: updated.likes } : p))
      );
    } catch {
      showToast('Like failed', 'error');
    }
  };

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Posts
          <span className="ml-2 text-sm text-gray-500 font-normal">({posts.length})</span>
        </h2>
        {isOwner && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Create New Post
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-400">
            {isOwner ? "You haven't published any posts yet." : 'No posts yet.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
            >
              Write your first post
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              showManage={isOwner}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}