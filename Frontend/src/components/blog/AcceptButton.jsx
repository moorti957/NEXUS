// src/components/blog/AcceptButton.jsx

import { useState } from 'react';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';

export default function AcceptButton({ postId, freelancerId, alreadyAccepted = false }) {
  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const [loading, setLoading]   = useState(false);

  const handleAccept = async () => {
    if (accepted) return;
    setLoading(true);

    try {
      const token = user?.token || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/collaborations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, freelancerId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept');

      setAccepted(true);
      showToast('Freelancer accepted! 🎉', 'success');
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
        <FiCheckCircle className="w-3.5 h-3.5" />
        Accepted
      </span>
    );
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all disabled:opacity-50"
    >
      {loading ? (
        <FiLoader className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FiCheckCircle className="w-3.5 h-3.5" />
      )}
      Accept Freelancer
    </button>
  );
}