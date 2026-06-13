// pages/FreelancerProfile.jsx
// Route: /freelancer/:id

import React, {
  useState, useEffect, useCallback, useMemo, useRef
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FiFolder,
  FiCheckCircle,
  FiZap,
  FiStar,
  FiAward,
  FiBarChart2,
  FiAlertCircle,
  FiMessageCircle 
} from "react-icons/fi";


// ── Reuse your existing ChatModal if available ───────────────────────
// import ChatModal from '../components/chat/ChatModal';

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

const getAvatarUrl = (avatar, name) => {
  if (avatar) {
    if (avatar.startsWith('http')) return avatar;
    const base = import.meta.env.VITE_API_URL || 'https://nexus-v40l.onrender.com';
    return `${base}${avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&size=200`;
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.trim().split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const LEVEL_COLORS = {
  Junior: 'from-emerald-400 to-teal-500',
  Intermediate: 'from-indigo-400 to-blue-500',
  Senior: 'from-purple-400 to-indigo-500',
  Expert: 'from-orange-400 to-rose-500',
};

// ════════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ════════════════════════════════════════════════════════════════════

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="min-h-screen pt-32 pb-20">
    <div className="max-w-6xl mx-auto px-6 space-y-8">
      {/* Hero */}
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Skeleton className="w-32 h-32 rounded-3xl flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-52" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      {/* About */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════
// STAR RATING
// ════════════════════════════════════════════════════════════════════

const StarRating = ({ rating, size = 'sm' }) => {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {stars.map(s => (
        <svg key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-white/20'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// SOCIAL ICON
// ════════════════════════════════════════════════════════════════════

const SOCIAL_META = {
  linkedin: {
    label: 'LinkedIn',
    color: 'hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-400',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  github: {
    label: 'GitHub',
    color: 'hover:bg-gray-600/20 hover:border-gray-500/40 hover:text-gray-300',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: 'hover:bg-pink-600/20 hover:border-pink-500/40 hover:text-pink-400',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    color: 'hover:bg-blue-700/20 hover:border-blue-600/40 hover:text-blue-500',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  portfolio: {
    label: 'Portfolio',
    color: 'hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-indigo-300',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
};

// ════════════════════════════════════════════════════════════════════
// SECTION CARD WRAPPER
// ════════════════════════════════════════════════════════════════════

const SectionCard = ({ title, icon, children, className = '' }) => (
  <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/20 transition-all duration-300 ${className}`}>
    {title && (
      <div className="flex items-center gap-2 mb-5">
        {icon && <span className="text-indigo-400">{icon}</span>}
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════

const StatCard = ({ label, value, gradient, icon }) => (
  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
    </div>
    <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}>
      {value}
    </div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

// ════════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════════

const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] animate-slideUp">
      <div className={`px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium border ${
        type === 'success'
          ? 'bg-green-500/90 text-white border-green-400'
          : 'bg-red-500/90 text-white border-red-400'
      }`}>
        {message}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════

export default function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [toast, setToast] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Fetch profile ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/freelancer-profile/public/${id}`);
        if (!cancelled) {
          setFreelancer(res.data.data);
          // Update document title for SEO
          document.title = `${res.data.data.name} | Freelancer Profile`;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [id]);

  // Cleanup title on unmount
  useEffect(() => {
    return () => { document.title = 'Dashboard'; };
  }, []);

  // ── Invite handler ─────────────────────────────────────────────────
  const handleInvite = async () => {
    setInviting(true);
    try {
      await api.post('/team/invite', { memberId: freelancer._id });
      setInvited(true);
      showToast('Invitation sent successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invite', 'error');
    } finally {
      setInviting(false);
    }
  };

  // ── Share profile ──────────────────────────────────────────────────
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: freelancer.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied!', 'success');
    }
  };

  // ── Computed values ────────────────────────────────────────────────
  const avatarUrl = useMemo(() => {
    if (!freelancer) return '';
    return imgError ? null : getAvatarUrl(freelancer.avatar, freelancer.name);
  }, [freelancer, imgError]);

  const levelGradient = useMemo(() => {
    return LEVEL_COLORS[freelancer?.experienceLevel] || LEVEL_COLORS.Intermediate;
  }, [freelancer?.experienceLevel]);

  // ── States ─────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />;

  if (error) return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
  <FiAlertCircle className="w-16 h-16 text-indigo-400 opacity-80" />
</div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );

  if (!freelancer) return null;

  const {
    name, username, email, avatar, phone, location, country, city,
    isOnline, memberSince, bio, about, experienceLevel, availability,
    languages, skills, socialLinks, projects, rating, reviewsCount,
    reviews, awards, certifications, completeness,
  } = freelancer;

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── Back Button ─────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* ══════════════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
          {/* Decorative gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/30">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">{getInitials(name)}</span>
                )}
              </div>
              {/* Online dot */}
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f0f14] ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{name}</h1>
                {/* Freelancer badge */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mt-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Freelancer
                </span>
                {/* Online status label */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Username */}
              <p className="text-indigo-400 text-sm mb-3">@{username}</p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-400 mb-4">
                {/* Experience level */}
                <span className={`inline-flex items-center gap-1.5 font-medium bg-gradient-to-r ${levelGradient} bg-clip-text text-transparent`}>
                  <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {experienceLevel}
                </span>
                {/* Location */}
                {(location || city || country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {location || [city, country].filter(Boolean).join(', ')}
                  </span>
                )}
                {/* Member since */}
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {memberSince}
                </span>
                {/* Availability */}
                <span className={`inline-flex items-center gap-1.5 ${availability === 'Available' ? 'text-green-400' : 'text-orange-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${availability === 'Available' ? 'bg-green-400' : 'bg-orange-400'}`} />
                  {availability}
                </span>
              </div>

              {/* Rating row */}
              {rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={rating} />
                  <span className="text-yellow-400 font-semibold text-sm">{rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({reviewsCount} reviews)</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleInvite}
                  disabled={inviting || invited}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg ${
                    invited
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                      : inviting
                        ? 'opacity-60 cursor-not-allowed bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  {invited ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Invitation Sent
                    </>
                  ) : inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Invite to Team
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowChat(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-gray-200 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat Now
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
         <StatCard
  label="Total Projects"
  value={projects?.total ?? 0}
  gradient="from-indigo-400 to-purple-500"
  icon={<FiFolder />}
/>

<StatCard
  label="Completed"
  value={projects?.completed ?? 0}
  gradient="from-green-400 to-emerald-500"
  icon={<FiCheckCircle />}
/>

<StatCard
  label="Active"
  value={projects?.active ?? 0}
  gradient="from-blue-400 to-cyan-500"
  icon={<FiZap />}
/>

<StatCard
  label="Reviews"
  value={reviewsCount ?? 0}
  gradient="from-yellow-400 to-orange-500"
  icon={<FiStar />}
/>

<StatCard
  label="Rating"
  value={rating > 0 ? rating.toFixed(1) : "N/A"}
  gradient="from-orange-400 to-rose-500"
  icon={<FiAward />}
/>

<StatCard
  label="Profile"
  value={`${completeness ?? 0}%`}
  gradient="from-purple-400 to-pink-500"
  icon={<FiBarChart2 />}
/>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            BIO + PROFESSIONAL INFO (2-col)
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* About */}
          <SectionCard
            title="About"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            {bio && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                <p className="text-gray-300 leading-relaxed text-sm">{bio}</p>
              </div>
            )}
            {about && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">About Me</p>
                <p className="text-gray-300 leading-relaxed text-sm">{about}</p>
              </div>
            )}
            {!bio && !about && (
              <p className="text-gray-500 italic text-sm">No bio provided yet.</p>
            )}
          </SectionCard>

          {/* Professional Info */}
          <SectionCard
            title="Professional Info"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Experience', value: experienceLevel },
                { label: 'Availability', value: availability },
                { label: 'Country', value: country || 'N/A' },
                { label: 'City', value: city || 'N/A' },
                { label: 'Phone', value: phone || 'N/A' },
                { label: 'Languages', value: languages?.length > 0 ? languages.join(', ') : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm text-gray-200 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Profile completeness bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Profile Completeness</span>
                <span className="text-indigo-400 font-semibold">{completeness}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SKILLS
        ══════════════════════════════════════════════════════════════ */}
        {skills && skills.length > 0 && (
          <SectionCard
            title="Skills"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          >
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25 hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SOCIAL LINKS
        ══════════════════════════════════════════════════════════════ */}
        {socialLinks && Object.values(socialLinks).some(Boolean) && (
          <SectionCard
            title="Social & Links"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
          >
            <div className="flex flex-wrap gap-3">
              {Object.entries(socialLinks).map(([key, url]) => {
                if (!url) return null;
                const meta = SOCIAL_META[key];
                if (!meta) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm transition-all duration-200 hover:-translate-y-0.5 ${meta.color}`}
                    title={meta.label}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </a>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ══════════════════════════════════════════════════════════════
            AWARDS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard
          title="Awards & Achievements"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        >
          {awards && awards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {awards.map((award, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all group">
                  <div className="text-3xl mb-2">{award.icon || '🏆'}</div>
                  <h4 className="font-semibold text-white mb-1 group-hover:text-yellow-300 transition-colors">{award.name}</h4>
                  {award.description && <p className="text-xs text-gray-400 mb-2">{award.description}</p>}
                  {award.date && <p className="text-xs text-gray-500">{formatDate(award.date)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="flex justify-center mb-2">
  <FiAward className="w-10 h-10 opacity-30" />
</div>
              <p className="text-sm">No awards yet</p>
            </div>
          )}
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            CERTIFICATIONS
        ══════════════════════════════════════════════════════════════ */}
        {certifications && certifications.length > 0 && (
          <SectionCard
            title="Certifications"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{cert.name}</h4>
                      {cert.organization && <p className="text-xs text-indigo-400 mt-0.5">{cert.organization}</p>}
                      {cert.issueDate && <p className="text-xs text-gray-500 mt-1">{formatDate(cert.issueDate)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ══════════════════════════════════════════════════════════════
            REVIEWS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard
          title={`Client Reviews ${reviewsCount > 0 ? `(${reviewsCount})` : ''}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        >
          {reviews && reviews.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(review.reviewerName || 'A')}
                      </div>
                      <span className="text-sm font-medium text-white">{review.reviewerName || 'Anonymous'}</span>
                    </div>
                    <StarRating rating={review.rating || 5} />
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{review.text}</p>
                  {review.date && <p className="text-xs text-gray-600 mt-2">{formatDate(review.date)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="flex justify-center mb-2">
  <FiMessageCircle className="w-10 h-10 opacity-30" />
</div>
              <p className="text-sm">No reviews yet</p>
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* ── Chat Modal (reuse existing) ───────────────────────────────── */}
      {showChat && (
        // If you have ChatModal already:
        // <ChatModal user={freelancer} onClose={() => setShowChat(false)} />
        //
        // Fallback: navigate to messages
        (() => {
          navigate(`/messages?user=${id}`);
          setShowChat(false);
          return null;
        })()
      )}
    </div>
  );
}