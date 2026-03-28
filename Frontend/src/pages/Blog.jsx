import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export default function Blog() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [categoryCounts, setCategoryCounts] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'technology',
    image: '',
    author: user?._id,
  });

  // Categories
  const categories = [
    { id: 'all', name: 'All Posts', icon: '📰', count: 0 },
    { id: 'technology', name: 'Technology', icon: '💻', count: 0 },
    { id: 'design', name: 'Design', icon: '🎨', count: 0 },
    { id: 'development', name: 'Development', icon: '⚙️', count: 0 },
    { id: 'business', name: 'Business', icon: '📊', count: 0 },
    { id: 'tutorials', name: 'Tutorials', icon: '📚', count: 0 },
  ];

  // Sample blog posts data
  // const samplePosts = [
  //   {
  //     id: 1,
  //     title: 'The Future of Web Development: What to Expect in 2024',
  //     excerpt: 'Explore the latest trends and technologies shaping the future of web development, from AI integration to WebAssembly.',
  //     content: 'Full content here...',
  //     category: 'technology',
  //     author: 'Alex Kim',
  //     authorAvatar: 'A',
  //     authorGradient: 'from-indigo-500 to-purple-600',
  //     date: '2024-03-15',
  //     readTime: '5 min read',
  //     image: '💻',
  //     likes: 124,
  //     comments: 23,
  //     featured: true,
  //   },
  //   {
  //     id: 2,
  //     title: 'Mastering UI/UX: A Comprehensive Guide',
  //     excerpt: 'Learn the principles of effective UI/UX design and how to create interfaces that users love.',
  //     content: 'Full content here...',
  //     category: 'design',
  //     author: 'Jordan Lee',
  //     authorAvatar: 'J',
  //     authorGradient: 'from-purple-500 to-pink-600',
  //     date: '2024-03-12',
  //     readTime: '8 min read',
  //     image: '🎨',
  //     likes: 89,
  //     comments: 15,
  //     featured: false,
  //   },
  //   {
  //     id: 3,
  //     title: '10 Essential React Hooks Every Developer Should Know',
  //     excerpt: 'Discover the most useful React hooks that will level up your development game.',
  //     content: 'Full content here...',
  //     category: 'development',
  //     author: 'Sam Chen',
  //     authorAvatar: 'S',
  //     authorGradient: 'from-pink-500 to-orange-600',
  //     date: '2024-03-10',
  //     readTime: '6 min read',
  //     image: '⚛️',
  //     likes: 256,
  //     comments: 42,
  //     featured: true,
  //   },
  //   {
  //     id: 4,
  //     title: 'Building a Successful SaaS Business: Lessons Learned',
  //     excerpt: 'Key insights and strategies for launching and scaling a successful SaaS product.',
  //     content: 'Full content here...',
  //     category: 'business',
  //     author: 'Maya Patel',
  //     authorAvatar: 'M',
  //     authorGradient: 'from-orange-500 to-yellow-600',
  //     date: '2024-03-08',
  //     readTime: '10 min read',
  //     image: '📈',
  //     likes: 67,
  //     comments: 12,
  //     featured: false,
  //   },
  //   {
  //     id: 5,
  //     title: 'Getting Started with Tailwind CSS',
  //     excerpt: 'A beginner-friendly guide to using Tailwind CSS for rapid UI development.',
  //     content: 'Full content here...',
  //     category: 'tutorials',
  //     author: 'Alex Kim',
  //     authorAvatar: 'A',
  //     authorGradient: 'from-indigo-500 to-purple-600',
  //     date: '2024-03-05',
  //     readTime: '4 min read',
  //     image: '🎨',
  //     likes: 178,
  //     comments: 31,
  //     featured: false,
  //   },
  //   {
  //     id: 6,
  //     title: 'The Rise of AI in Digital Marketing',
  //     excerpt: 'How artificial intelligence is transforming digital marketing strategies and customer engagement.',
  //     content: 'Full content here...',
  //     category: 'technology',
  //     author: 'Jordan Lee',
  //     authorAvatar: 'J',
  //     authorGradient: 'from-purple-500 to-pink-600',
  //     date: '2024-03-03',
  //     readTime: '7 min read',
  //     image: '🤖',
  //     likes: 145,
  //     comments: 28,
  //     featured: true,
  //   },
  // ];

  // Load posts
 useEffect(() => {
  fetch("http://localhost:5000/api/posts")
    .then(res => res.json())
    .then(data => {
      setPosts(data);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
      showToast("Failed to load posts", "error");
    });
}, []);

  // Update category counts
  useEffect(() => {
  const counts = {};

  posts.forEach(post => {
    counts[post.category] = (counts[post.category] || 0) + 1;
  });

  setCategoryCounts(counts);
}, [posts]);

  // Filter posts
 const filteredPosts = posts.filter(post => {
  const matchesCategory =
    selectedCategory === 'all' || post.category === selectedCategory;

  const matchesSearch =
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());

  return matchesCategory && matchesSearch;
});

  // Featured posts
  const featuredPosts = posts.filter(post => post.featured);

  // Handle create post
 const handleCreatePost = async (e) => {
  e.preventDefault();

  const token = user?.token || localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,   // ✅ IMPORTANT
      },
      body: JSON.stringify(newPost),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error");
    }

    setPosts([data, ...posts]);
    setShowCreateModal(false);

    showToast("Post created!", "success");
  } catch (err) {
    console.log(err);
    showToast("Unauthorized or error", "error");
  }
};

  // Handle like post
const handleLike = async (postId) => {

  // 🔥 LOGIN CHECK (ADD THIS)
  if (!user) {
    showToast("Please login to like posts 🔐", "error");
    return;
  }

  const token = user?.token || localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const updated = await res.json();

    console.log("👤 CURRENT USER ID 👉", user?._id);
    console.log("📦 UPDATED RESPONSE 👉", updated);

    if (!res.ok) {
      throw new Error(updated.message);
    }

    const isLiked = updated.likes?.some((u) => {
      const likeId = typeof u === "object" ? u._id : u;
      return likeId?.toString() === user?._id?.toString();
    });

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? {
              ...post,
              ...updated,
              author: updated.author || post.author,
            }
          : post
      )
    );

    if (isLiked) {
      showToast("Post liked ❤️", "success");
    } else {
      showToast("Like removed 💔", "info");
    }

  } catch (err) {
    console.log(err);
    showToast("Like failed ❌", "error");
  }
};

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
              Stay updated with the latest trends, tutorials, and insights from our team of experts.
            </p>
          </Reveal>
        </div>

        {/* Search and Create Bar */}
        <Reveal delay={600} className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Create Post Button (if logged in) */}
            {user && (
              <Button
                onClick={() => setShowCreateModal(true)}
                iconLeft={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Write Article
              </Button>
            )}
          </div>
        </Reveal>

        {/* Categories */}
        <Reveal delay={800} className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-6 py-3 rounded-full text-sm font-medium
                  transition-all duration-300 flex items-center gap-2
                  ${selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }
                `}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${selectedCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-gray-400'
                  }
                `}>
                  {category.id === 'all'
  ? posts.length
  : categoryCounts[category.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Featured Posts */}
        {selectedCategory === 'all' && featuredPosts.length > 0 && searchQuery === '' && (
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
              {featuredPosts.map((post, index) => (
                <Reveal key={post._id} delay={index * 200} type="scale">
                  <Link to={`/blog/${post._id}`} className="group block h-full">
                    <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/10 hover:border-yellow-500/30 transition-all duration-500">
                      {/* Featured Badge */}
                      <span className="inline-block px-3 py-1 mb-4 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        Featured
                      </span>

                      {/* Post Image/Icon */}
                      <div className="text-4xl mb-4">{post.image}</div>

                      {/* Post Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-400 mb-6">{post.excerpt}</p>

                      {/* Author */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full
                            bg-gradient-to-br ${post.authorGradient}
                            flex items-center justify-center text-sm font-bold
                          `}>
                            {post.authorAvatar}
                          </div>
                          <div>
                            <div className="font-medium">{post.author?.name || "User"}</div>
                            <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-sm text-gray-500">
       <button
  disabled={!user}
  onClick={(e) => {
    e.preventDefault();
    handleLike(post._id);
  }}
  className={`flex items-center gap-1 transition-colors ${
    !user
      ? "opacity-50 cursor-not-allowed"
      : "hover:text-red-400"
  }`}
>
  ❤️ {post.likes?.length || 0}
</button>
                          <span className="flex items-center gap-1">
                            💬 {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {filteredPosts.map((post, index) => (
                  <Reveal key={post._id} delay={index * 100} type="up">
                    <Link to={`/blog/${post._id}`} className="group block h-full">
                      <div className="h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all duration-500">
                        {/* Post Image/Icon */}
                        <div className="text-3xl mb-4">{post.image}</div>

                        {/* Category Badge */}
                        <span className={`
                          inline-block px-3 py-1 mb-4 rounded-full text-xs font-medium
                          ${post.category === 'technology' ? 'bg-blue-500/20 text-blue-400' : ''}
                          ${post.category === 'design' ? 'bg-purple-500/20 text-purple-400' : ''}
                          ${post.category === 'development' ? 'bg-green-500/20 text-green-400' : ''}
                          ${post.category === 'business' ? 'bg-orange-500/20 text-orange-400' : ''}
                          ${post.category === 'tutorials' ? 'bg-pink-500/20 text-pink-400' : ''}
                        `}>
                          {post.category}
                        </span>

                        {/* Post Meta */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                          {post.excerpt}
                        </p>

                        {/* Author & Stats */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <div className={`
                              w-8 h-8 rounded-full
                              bg-gradient-to-br ${post.authorGradient}
                              flex items-center justify-center text-xs font-bold
                            `}>
                              {post.author?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{post.author?.name || "Unknown"}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleLike(post._id);
                              }}
                              className="flex items-center gap-1 hover:text-red-400 transition-colors"
                            >
                              ❤️ {post.likes?.length || 0}
                            </button>
                            <span className="flex items-center gap-1">
                              💬 {post.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            ) : (
              // No results
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">No articles found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search or filter to find what you're looking for.</p>
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

            {/* Load More Button */}
            {filteredPosts.length > 0 && filteredPosts.length < posts.length && (
              <div className="text-center">
                <Button variant="glass" size="lg">
                  Load More Articles
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
              Get the latest articles, tutorials, and insights delivered straight to your inbox.
            </p>
          </Reveal>
          
          <Reveal delay={400}>
            <form 
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Subscribed successfully! (Demo)', 'success');
                e.target.reset();
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 px-6 py-4 rounded-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Button type="submit">
                Subscribe
              </Button>
            </form>
          </Reveal>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          ></div>
          
          {/* Modal Content */}
          <Reveal type="scale" className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#13131a] border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-display gradient-text">
                    Create New Post
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreatePost} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter post title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
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
                  <label className="block text-sm font-medium mb-2">Excerpt</label>
                  <textarea
                    required
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Brief description of your post"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    required
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows="6"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Write your post content..."
                  />
                </div>

                {/* Image/Icon */}
                <div>
                  <label className="block text-sm font-medium mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={newPost.image}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="e.g., 💻, 🎨, 📚"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" size="lg" fullWidth>
                    Publish Post
                  </Button>
                  <Button 
                    type="button" 
                    variant="glass" 
                    size="lg" 
                    fullWidth
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}