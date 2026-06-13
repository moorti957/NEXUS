// src/pages/Blog.jsx
import { useState, useEffect } from 'react';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/blog/PostCard';
import CreatePostModal from '../components/blog/CreatePostModal';
import {
  FiGrid, FiMonitor, FiPenTool, FiCode, FiBarChart2, FiBookOpen,
} from 'react-icons/fi';

const categories = [
  { id: 'all',         name: 'All Posts',   icon: <FiGrid /> },
  { id: 'technology',  name: 'Technology',  icon: <FiMonitor /> },
  { id: 'design',      name: 'Design',      icon: <FiPenTool /> },
  { id: 'development', name: 'Development', icon: <FiCode /> },
  { id: 'business',    name: 'Business',    icon: <FiBarChart2 /> },
  { id: 'tutorials',   name: 'Tutorials',   icon: <FiBookOpen /> },
];

export default function Blog() {
  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load posts
  useEffect(() => {
    fetch(`${BASE_URL}/posts`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('Failed to load posts', 'error');
      });
  }, []);

  // Like handler
  const handleLike = async (postId) => {
    if (!user) {
      showToast('Please login to like posts 🔐', 'error');
      return;
    }
    const token = user?.token || localStorage.getItem('token');
    try {
      const res = await fetch(`${BASE_URL}/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: updated.likes } : p))
      );
    } catch {
      showToast('Like failed ❌', 'error');
    }
  };

  // Delete handler (passed to PostCard)
  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // New post handler
  const handleCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Category counts
  const categoryCounts = posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredPosts = posts.filter((p) => p.featured);

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Reveal>
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
              Our Blog
            </span>
          </Reveal>
          <Reveal delay={200}>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
              Latest <span className="gradient-text">Insights</span>
            </h1>
          </Reveal>
          <Reveal delay={400}>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Stay updated with the latest trends, tutorials, and insights.
            </p>
          </Reveal>
        </div>

        {/* Search and Create Bar */}
        <Reveal delay={600} className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button
              onClick={() => {
                if (!user) {
                  showToast('🔐 Please login first', 'error');
                  return;
                }
                setShowCreateModal(true);
              }}
              iconLeft={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Write Article
            </Button>
          </div>
        </Reveal>

        {/* Categories */}
        <Reveal delay={800} className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                  ${selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === cat.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {cat.id === 'all' ? posts.length : categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Featured Posts */}
        {selectedCategory === 'all' && featuredPosts.length > 0 && !searchQuery && (
          <div className="mb-20">
            <Reveal>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  ⭐
                </span>
                Featured Articles
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post, i) => (
                <Reveal key={post._id} delay={i * 200} type="scale">
                  <PostCard post={post} onLike={handleLike} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {filteredPosts.map((post, i) => (
                  <Reveal key={post._id} delay={i * 100} type="up">
                    <PostCard
                      post={post}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      showManage={user?._id?.toString() === post.author?._id?.toString()}
                    />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">No articles found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search or filter.
                </p>
                <Button
                  variant="glass"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}

        {/* Newsletter Section */}
        <div className="mt-32 p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Subscribe to Our <span className="gradient-text">Newsletter</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Get the latest articles and insights delivered to your inbox.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Subscribed! (Demo)', 'success');
                e.target.reset();
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </Reveal>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}