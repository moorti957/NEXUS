import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Helper: compute read time from content (approx 200 words per minute)
  const getReadTime = (content) => {
    if (!content) return '1 min read';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // Helper: get emoji based on category
  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'technology': return '💻';
      case 'design': return '🎨';
      case 'development': return '⚙️';
      case 'business': return '📊';
      case 'tutorials': return '📚';
      default: return '📝';
    }
  };

  // Helper: get gradient based on author name (for consistent avatar styling)
  const getAuthorGradient = (name) => {
    if (!name) return 'from-gray-500 to-gray-600';
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-purple-500 to-pink-600',
      'from-pink-500 to-orange-600',
      'from-orange-500 to-yellow-600',
      'from-green-500 to-teal-600',
      'from-blue-500 to-indigo-600',
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  // Fetch post from API
  const fetchPost = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`);
      if (!res.ok) {
        throw new Error('Post not found');
      }
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error(err);
      setError(true);
      showToast(err.message || 'Failed to load post', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!user) {
      showToast('Please login to like posts 🔐', 'error');
      return;
    }

    const token = user?.token || localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updated = await res.json();

      if (!res.ok) {
        throw new Error(updated.message || 'Like failed');
      }

      // Update post state with the new data
      setPost((prev) => ({
        ...prev,
        ...updated,
        author: updated.author || prev.author,
      }));

      const isLiked = updated.likes?.some((u) => {
        const likeId = typeof u === 'object' ? u._id : u;
        return likeId?.toString() === user?._id?.toString();
      });

      if (isLiked) {
        showToast('Post liked ❤️', 'success');
      } else {
        showToast('Like removed 💔', 'info');
      }
    } catch (err) {
      console.log(err);
      showToast('Like failed ❌', 'error');
    }
  };

  // Handle comment submission
  const handleComment = async (e) => {
  e.preventDefault();

  if (!user) {
    showToast('Please login to comment', 'warning');
    return;
  }

  if (!commentText.trim()) return;

  const token = user?.token || localStorage.getItem('token');

  try {
    const res = await fetch(`http://localhost:5000/api/posts/comment/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: commentText }),
    });

    if (!res.ok) throw new Error("Comment failed");

    setCommentText('');

    // 🔥 BEST: reload fresh populated data
    await fetchPost();

    showToast('Comment added!', 'success');

  } catch (err) {
    console.log(err);
    showToast('Failed to add comment', 'error');
  }
};

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <Link to="/blog">
          <Button>Back to Blog</Button>
        </Link>
      </div>
    );
  }

  // Prepare data for display
  const category = post.category;
  const title = post.title;
  const content = post.content;
  const authorName = post.author?.name || 'Anonymous';
  const authorAvatar = authorName.charAt(0).toUpperCase();
  const authorGradient = getAuthorGradient(authorName);
  const date = new Date(post.createdAt).toLocaleDateString();
  const readTime = getReadTime(post.content);
  const imageEmoji = post.image || getCategoryEmoji(category);
  const likesCount = post.likes?.length || 0;
  const commentsList = post.comments || [];

  // Determine if current user has liked the post
  const isLiked = user
    ? post.likes?.some((like) => {
        const likeId = typeof like === 'object' ? like._id : like;
        return likeId?.toString() === user._id?.toString();
      })
    : false;

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <Reveal>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </button>
        </Reveal>

        {/* Post Header */}
        <Reveal>
          <div className="mb-8">
            {/* Category Badge */}
            <span
              className={`
                inline-block px-4 py-2 mb-6 rounded-full text-sm font-medium
                ${category === 'technology' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${category === 'design' ? 'bg-purple-500/20 text-purple-400' : ''}
                ${category === 'development' ? 'bg-green-500/20 text-green-400' : ''}
                ${category === 'business' ? 'bg-orange-500/20 text-orange-400' : ''}
                ${category === 'tutorials' ? 'bg-pink-500/20 text-pink-400' : ''}
              `}
            >
              {category}
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">
              {title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-6 text-gray-400 mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-full
                    bg-gradient-to-br ${authorGradient}
                    flex items-center justify-center text-sm font-bold
                  `}
                >
                  {authorAvatar}
                </div>
                <div>
                  <div className="font-medium text-white">{authorName}</div>
                  <div className="text-xs">{date}</div>
                </div>
              </div>
              <span>•</span>
              <span>{readTime}</span>
            </div>
          </div>
        </Reveal>

        {/* Post Image/Icon */}
        <Reveal delay={200} className="mb-12">
          <div className="text-8xl text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/10">
            {imageEmoji}
          </div>
        </Reveal>

        {/* Post Content */}
        <Reveal delay={400}>
          <div
            className="prose prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Reveal>

        {/* Like Button */}
        <Reveal delay={600}>
          <div className="flex items-center gap-6 mb-12">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 transition-all ${
                isLiked ? 'text-red-400' : 'hover:text-red-400'
              }`}
            >
              <span>❤️</span>
              <span>{likesCount} likes</span>
            </button>
          </div>
        </Reveal>

        {/* Comments Section */}
        <Reveal delay={800}>
          <div className="border-t border-white/10 pt-12">
            <h2 className="text-2xl font-bold mb-8">Comments ({commentsList.length})</h2>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="mb-12">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? 'Write a comment...' : 'Please login to comment'}
                disabled={!user}
                rows="4"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all mb-4"
              />
              <Button type="submit" disabled={!user || !commentText.trim()}>
                Post Comment
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {commentsList.map((comment) => {
                const commentUser = comment.user || {};
                const userName = commentUser.name || 'Anonymous';
                const userAvatar = userName.charAt(0).toUpperCase();
                const commentDate = new Date(comment.createdAt).toLocaleDateString();

                return (
                  <div key={comment._id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                        {userAvatar}
                      </div>
                      <div>
                        <div className="font-medium">{userName}</div>
                        <div className="text-xs text-gray-500">{commentDate}</div>
                      </div>
                    </div>
                    <p className="text-gray-300">{comment.text}</p>
                  </div>
                );
              })}

              {commentsList.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}