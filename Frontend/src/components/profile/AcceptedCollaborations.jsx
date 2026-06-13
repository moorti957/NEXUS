// src/components/profile/AcceptedCollaborations.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiUser, FiExternalLink } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export default function AcceptedCollaborations() {
  const BASE_URL      = `${import.meta.env.VITE_API_URL}/api`;
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [collabs, setCollabs]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const role = user?.role; // 'client' | 'freelancer'

  useEffect(() => {
    const token = user?.token || localStorage.getItem('token');
    fetch(`${BASE_URL}/collaborations/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCollabs(data.data);
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to load collaborations', 'error');
        setLoading(false);
      });
  }, []);

  const openChat = async (otherUserId) => {
    try {
      const token = user?.token || localStorage.getItem('token');
      const res   = await fetch(`${BASE_URL}/chats/conversation`, {
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        Accepted Collaborations
        <span className="ml-2 text-sm text-gray-500 font-normal">({collabs.length})</span>
      </h2>

      {collabs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-gray-400">No collaborations yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {collabs.map((collab) => {
            // ── CLIENT sees freelancer cards ─────────────────
            if (role === 'client') {
              const fl = collab.freelancerId;
              return (
                <div
                  key={collab._id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold overflow-hidden">
                      {fl?.avatar ? (
                        <img src={fl.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        fl?.name?.charAt(0).toUpperCase() || 'F'
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{fl?.name || 'Freelancer'}</div>
                      <div className="text-xs text-gray-500">
                        {fl?.city && fl?.country ? `${fl.city}, ${fl.country}` : ''}
                      </div>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                      Freelancer
                    </span>
                  </div>

                  {/* Skills */}
                  {fl?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {fl.skills.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {s}
                        </span>
                      ))}
                      {fl.skills.length > 4 && (
                        <span className="text-xs text-gray-500">+{fl.skills.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Post title */}
                  <p className="text-xs text-gray-500 mb-4">
                    Post: <span className="text-gray-300">{collab.postId?.title || '—'}</span>
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openChat(fl?._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium transition-all"
                    >
                      <FiMessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                    <button
                      onClick={() => navigate(`/profile/${fl?._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-all"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                  </div>
                </div>
              );
            }

            // ── FREELANCER sees client cards ──────────────────
            const cl = collab.clientId;
            return (
              <div
                key={collab._id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-lg font-bold overflow-hidden">
                    {cl?.avatar ? (
                      <img src={cl.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      cl?.name?.charAt(0).toUpperCase() || 'C'
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{cl?.name || 'Client'}</div>
                    <div className="text-xs text-gray-500">{cl?.companyName || ''}</div>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase">
                    Client
                  </span>
                </div>

                {/* Post title */}
                <p className="text-xs text-gray-500 mb-4">
                  Accepted for:{' '}
                  <span className="text-gray-300">{collab.postId?.title || '—'}</span>
                </p>

                {/* Chat button */}
                <button
                  onClick={() => openChat(cl?._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium transition-all"
                >
                  <FiMessageCircle className="w-3.5 h-3.5" />
                  Chat
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}