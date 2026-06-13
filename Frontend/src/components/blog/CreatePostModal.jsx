// src/components/blog/CreatePostModal.jsx
// Shared modal — used from Blog.jsx AND ProfilePostsTab.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostModal({ onClose, onCreated }) {
  const BASE_URL     = `${import.meta.env.VITE_API_URL}/api`;
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [newPost, setNewPost] = useState({
    title: '', excerpt: '', content: '', category: 'technology', image: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = user?.token || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newPost, author: user._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      showToast('Post published! 🎉', 'success');
      onCreated?.(data);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#13131a] border border-white/10 shadow-2xl z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">Create New Post</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              required
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Enter post title"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option value="technology">Technology</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="business">Business</option>
              <option value="tutorials">Tutorials</option>
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Excerpt *</label>
            <textarea
              required
              rows={3}
              value={newPost.excerpt}
              onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Short description..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Content *</label>
            <textarea
              required
              rows={7}
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Write your post content..."
            />
          </div>

          {/* Emoji icon */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Icon (emoji)</label>
            <input
              type="text"
              value={newPost.image}
              onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="💻  🎨  📚"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" fullWidth disabled={saving}>
              {saving ? 'Publishing...' : 'Publish Post'}
            </Button>
            <Button type="button" variant="glass" size="lg" fullWidth onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}