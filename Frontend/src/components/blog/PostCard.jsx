// src/components/blog/PostCard.jsx
// Reusable card — used in Blog.jsx AND ProfilePostsTab.jsx

import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

const CATEGORY_COLORS = {
  technology:  'bg-blue-500/20 text-blue-400',
  design:      'bg-purple-500/20 text-purple-400',
  development: 'bg-green-500/20 text-green-400',
  business:    'bg-orange-500/20 text-orange-400',
  tutorials:   'bg-pink-500/20 text-pink-400',
};

export default function PostCard({ post, onLike, onDelete, showManage = false }) {
  const BASE_URL   = `${import.meta.env.VITE_API_URL}/api`;
  const { user }   = useAuth();
  const { showToast } = useToast();
  const navigate   = useNavigate();

  const isLiked = post.likes?.some((l) => {
    const id = typeof l === 'object' ? l._id : l;
    return id?.toString() === user?._id?.toString();
  });

  const handleDeleteClick = async (e) => {
    e.preventDefault();
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = user?.token || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/posts/${post._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast('Post deleted', 'success');
      onDelete?.(post._id);
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  return (
    <div className="relative group h-full">
      <Link to={`/posts/${post._id}`} className="block h-full">
        <div className="h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all duration-500">
          {/* Emoji icon */}
          <div className="text-3xl mb-4">{post.image || '📝'}</div>

          {/* Category badge */}
          <span className={`inline-block px-3 py-1 mb-4 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || 'bg-gray-500/20 text-gray-400'}`}>
            {post.category}
          </span>

          {/* Date */}
          <div className="text-xs text-gray-500 mb-2">
            {new Date(post.createdAt).toLocaleDateString()}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-400 text-sm mb-5 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Footer: author + stats */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  post.author?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <span className="text-xs text-gray-400">{post.author?.name || 'Unknown'}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onLike?.(post._id);
                }}
                className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-400' : 'hover:text-red-400'}`}
              >
                <FiHeart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-400' : ''}`} />
                {post.likes?.length || 0}
              </button>
              <span className="flex items-center gap-1">
                <FiMessageCircle className="w-3.5 h-3.5" />
                {post.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Manage buttons (owner only) — shown outside Link to avoid nesting */}
      {showManage && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate(`/posts/${post._id}/edit`);
            }}
            className="w-8 h-8 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 flex items-center justify-center transition-all"
            title="Edit post"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-all"
            title="Delete post"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}