// src/components/blog/Comment.jsx

import { useAuth } from '../../context/AuthContext';
import RoleBadge from './RoleBadge';
import AcceptButton from './AcceptButton';
import { FiMessageCircle } from 'react-icons/fi';

export default function Comment({ comment, post, onChatClick }) {
  const { user } = useAuth();

  // isCurrentUserPostOwner — client jo post ka malik hai
  const isPostOwner =
    user && post?.author?._id?.toString() === user._id?.toString();

  // Is comment freelancer ka hai?
  const isFreelancerComment =
  comment.user?.role?.toLowerCase() === 'freelancer';

const alreadyAccepted = post?.acceptedFreelancers?.some(
  (af) => af.userId?.toString() === comment.user?._id?.toString()
);

  const commenterName = comment.user?.name || 'Unknown';
const commenterAvatar = comment.user?.avatar;
  const initial         = commenterName.charAt(0).toUpperCase();

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
        {commenterAvatar ? (
          <img src={commenterAvatar} alt={commenterName} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: name + badge + time */}
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <span className="text-sm font-semibold">{commenterName}</span>
          <RoleBadge role={comment.user?.role} />
          <span className="text-xs text-gray-500 ml-auto">{timeAgo(comment.createdAt)}</span>
        </div>

        {/* Comment text */}
        <p className="text-sm text-gray-300 leading-relaxed break-words">
          {comment.text}
        </p>

        {/* Action buttons — only shown to post owner */}
        {isPostOwner && (
          <div className="flex items-center gap-2 mt-3">
            {/* Accept button — only for freelancer comments */}
            {isFreelancerComment && (
              <AcceptButton
                postId={post._id}
                freelancerId={comment.user?._id}
                alreadyAccepted={alreadyAccepted}
              />
            )}

            {/* Chat button — for both roles */}
            <button
              onClick={() => onChatClick?.(comment.user?._id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium transition-all"
            >
              <FiMessageCircle className="w-3.5 h-3.5" />
              Chat

            </button>
          </div>
        )}
      </div>
    </div>
  );
}