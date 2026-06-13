import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendWhatsAppMessage } from "../services/api";
import { io, Socket } from "socket.io-client";

// ========== Types ==========
interface Freelancer {
  _id: string;
  name: string;
  userId?: string;
  email: string;
  avatar?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  createdAt?: string;
  isOnline?: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
}

interface Invitation {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  invitedBy: {
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string[];
  };
  team?: {
    name: string;
    avatar?: string;
  };
}

interface InviteModalProps {
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  freelancers: Freelancer[];
  invitedIds: string[];
  handleSendInvite: (id: string) => void | Promise<void>;
  onAddMember?: (data: { name: string; phone: string }) => Promise<void>;
  loading?: boolean;
  refreshFreelancers?: () => void;
}

// ========== Helpers ==========
const getInitials = (name: string) => {
  if (!name || typeof name !== "string") return "U";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarUrlFixed = (avatar: string | undefined, name: string) => {
  if (avatar) return avatar;
  const safeName = name || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=6366f1&color=fff`;
};

const computeCompleteness = (freelancer: Freelancer): number => {
  let score = 0;
  if (freelancer.avatar) score += 25;
  if (freelancer.phone) score += 25;
  if (freelancer.location) score += 25;
  if (freelancer.skills && freelancer.skills.length > 0) score += 25;
  return score;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ========== Sub-components ==========
const SearchBar = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
  <div className="relative flex-1 max-w-md">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      placeholder="Search by name or email..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
    />
  </div>
);

const FilterDropdown = ({ activeFilter, onSelect }: { activeFilter: string; onSelect: (filter: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filters = [
    { id: 'none', label: 'Default' },
    { id: 'completeness', label: 'Profile completeness (100% first)' },
    { id: 'alphabetical', label: 'Alphabetical (A-Z)' },
    { id: 'recentlyJoined', label: 'Recently joined' },
    { id: 'withSkills', label: 'Only with skills' },
    { id: 'onlineUsers', label: 'Online users' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-fadeInUp">
          <div className="p-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => { onSelect(filter.id); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === filter.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300 hover:bg-white/10'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AddMemberModal = ({ isOpen, onClose, onSubmit, isLoading }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (name.trim() && phone.trim()) onSubmit(name.trim(), phone.trim()); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f0f14] border border-white/20 rounded-2xl shadow-2xl p-6 animate-scaleIn">
        <h3 className="text-xl font-bold text-white mb-4">Add Freelancer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mobile Number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50">{isLoading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-5"><div className="w-16 h-16 rounded-2xl bg-white/10" /><div className="flex-1"><div className="h-5 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/10 rounded w-1/2" /></div></div>
    <div className="grid grid-cols-2 gap-3 mb-5"><div className="h-8 bg-white/10 rounded" /><div className="h-8 bg-white/10 rounded" /></div>
    <div className="flex gap-3 pt-3"><div className="h-9 bg-white/10 rounded flex-1" /><div className="h-9 bg-white/10 rounded flex-1" /></div>
  </div>
);

// ========== Main Component ==========
export const InviteFreelancersModal: React.FC<InviteModalProps> = ({
  inviteModalOpen,
  setInviteModalOpen,
  freelancers,
  invitedIds,
  handleSendInvite,
  onAddMember,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'freelancers' | 'invitations'>('freelancers');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('none');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const socketRef = useRef<Socket | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ========== Freelancers Filtering ==========
  const filteredFreelancers = useMemo(() => {
    let result = [...freelancers];
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.trim().toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(searchLower) || (f.email || "").toLowerCase().includes(searchLower));
    }
    switch (activeFilter) {
      case 'withSkills': result = result.filter(f => f.skills && f.skills.length > 0); break;
      case 'onlineUsers': result = result.filter(f => f.isOnline === true); break;
      case 'completeness': result.sort((a, b) => computeCompleteness(b) - computeCompleteness(a)); break;
      case 'alphabetical': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'recentlyJoined': result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break;
      default: break;
    }
    return result;
  }, [freelancers, debouncedSearch, activeFilter]);

  // ========== Invitations API ==========
  const fetchAllInvitations = async () => {
    setLoadingInvitations(true);
    
    try {
      
      const token = localStorage.getItem("token");
      const [pendingRes, acceptedRes, rejectedRes] = await Promise.allSettled([
        fetch('http://localhost:5000/api/team/invitations/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/team/invitations/accepted', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/team/invitations/rejected', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const pendingData = pendingRes.status === 'fulfilled' && pendingRes.value.ok ? await pendingRes.value.json() : { data: [] };
      console.log("PENDING DATA", pendingData);
      const acceptedData = acceptedRes.status === 'fulfilled' && acceptedRes.value.ok ? await acceptedRes.value.json() : { data: [] };
      console.log("ACCEPTED DATA", acceptedData);
      const rejectedData = rejectedRes.status === 'fulfilled' && rejectedRes.value.ok ? await rejectedRes.value.json() : { data: [] };
      console.log("REJECTED DATA", rejectedData);
      const all = [
        ...(pendingData.data || []).map((i: any) => ({ ...i, status: 'pending' })),
        ...(acceptedData.data || []).map((i: any) => ({ ...i, status: 'accepted' })),
        ...(rejectedData.data || []).map((i: any) => ({ ...i, status: 'rejected' }))
      ];
      setInvitations(all);
      setUnreadCount(all.filter(i => i.status === 'pending').length);
    } catch (error) {
      console.error("Failed to fetch invitations", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Refresh notifications bell (pending only)
  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/team/invitations/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.length);
      }
    } catch (err) { console.log("Notification error", err); }
  };

  // Accept/Reject handlers (reuse existing logic)
  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const res = await fetch(
  `http://localhost:5000/api/team/invitations/${inviteId}/accept`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  }
);
      const data = await res.json();
      if (data.success) {
        showToast("Invitation accepted!", "success");
        await fetchAllInvitations();
        await fetchNotifications();
      }
    } catch (err) {
      showToast("Failed to accept invite", "error");
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/team/invitations/${inviteId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Invitation rejected", "success");
        await fetchAllInvitations();
        await fetchNotifications();
      }
    } catch (err) {
      showToast("Failed to reject invite", "error");
    }
  };

  const handleChat = (invitation: Invitation) => {
    // Implement your chat navigation/logic
    showToast("Chat feature coming soon", "success");
  };

  // ========== Socket (unchanged) ==========
  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"]
    });
    socketRef.current.on("connect", () => {
      const userId = localStorage.getItem("userId");
      if (userId) socketRef.current?.emit("join-user", userId);
    });
    socketRef.current.on("invite:received", (data: any) => {
      setNotifications(prev => prev.some(n => n._id === data.inviteId) ? prev : [{ _id: data.inviteId, owner: { name: data.fromName } }, ...prev]);
      setUnreadCount(prev => prev + 1);
      fetchAllInvitations(); // refresh invitations tab
    });
    return () => {
      socketRef.current?.off("invite:received");
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (inviteModalOpen) {
      fetchAllInvitations();
      fetchNotifications();
    }
  }, [inviteModalOpen]);

  const handleAddMemberSubmit = async (name: string, phone: string) => {
    setAddMemberLoading(true);
    try {
      await sendWhatsAppMessage(name, phone);
      if (onAddMember) await onAddMember({ name, phone });
      showToast("Freelancer added & WhatsApp sent!", "success");
      setShowAddMember(false);
    } catch (error) {
      showToast("WhatsApp send failed", "error");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const onInviteClick = async (freelancerId: string) => {
    try {
      await handleSendInvite(freelancerId);
      showToast('Invitation sent successfully!', 'success');
    } catch (error) {
      showToast('Failed to send invitation.', 'error');
    }
  };

  if (!inviteModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
        <div className="relative w-full max-w-7xl max-h-[90vh] bg-[#0f0f14] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fadeInUp">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/10">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                Invite Freelancers
              </h2>
              <div className="flex-1 flex items-center gap-2">
                {activeTab === 'freelancers' && (
                  <>
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                    <FilterDropdown activeFilter={activeFilter} onSelect={setActiveFilter} />
                  </>
                )}
                <div className="relative">
                  <button onClick={() => { setShowNotifications(prev => !prev); if (!showNotifications) setUnreadCount(0); }} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all relative">
                    🔔
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white px-1.5 py-[1px] rounded-full animate-pulse">{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50 p-3 animate-fadeInUp">
                      {notifications.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No notifications</p> : (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {notifications.map((n) => (
                            <div key={n._id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <p className="text-sm text-white mb-2"><span className="text-indigo-400 font-medium">{n.owner?.name || "Someone"}</span> invited you to join their team</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleAcceptInvite(n._id)} className="px-3 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white">Accept</button>
                                <button onClick={() => handleRejectInvite(n._id)} className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white">Reject</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-white/10 px-6">
            <button
              onClick={() => setActiveTab('freelancers')}
              className={`px-5 py-3 text-sm font-medium transition-all relative ${activeTab === 'freelancers' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Freelancers ({freelancers.length})
              {activeTab === 'freelancers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-5 py-3 text-sm font-medium transition-all relative ${activeTab === 'invitations' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Invitations ({invitations.length})
              {activeTab === 'invitations' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />}
            </button>
          </div>

          {/* Add Member Button (only for freelancers tab) */}
          {activeTab === 'freelancers' && (
            <div className="px-6 pt-4 pb-2 border-b border-white/10">
              <button onClick={() => setShowAddMember(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add Freelancer
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'freelancers' && (
              <>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                ) : filteredFreelancers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>{(searchTerm || activeFilter !== 'none') ? 'No matching freelancers found' : 'No freelancers available'}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-400 mb-4">Showing {filteredFreelancers.length} of {freelancers.length} freelancers</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredFreelancers.map((freelancer) => {
                        const isInvited = invitedIds.includes(freelancer._id);
                        return (
                          <div key={freelancer._id} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-white/10 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="flex items-center gap-4 mb-5">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                                  {freelancer.avatar ? (
                                    <img src={getAvatarUrlFixed(freelancer.avatar, freelancer.name || freelancer.user?.name || "User")} alt={freelancer.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; const parent = e.currentTarget.parentNode as HTMLElement; if (parent) parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">${getInitials(freelancer.name)}</div>`; }} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{getInitials(freelancer.name)}</div>
                                  )}
                                </div>
                                {freelancer.isOnline && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white/20" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg truncate">{freelancer.name || freelancer.user?.name || "Unknown User"}</h3>
                                <p className="text-sm text-gray-400 truncate">{freelancer.email || freelancer.user?.email || "No email"}</p>
                                <p className="text-xs text-indigo-400 mt-1">Freelancer</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p><p className="text-gray-300 font-medium">{freelancer.phone || freelancer.user?.phone || <span className="italic text-gray-500 text-xs">Not provided</span>}</p></div>
                              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Location</p><p className="text-gray-300 font-medium">{freelancer.location || freelancer.user?.location || <span className="italic text-gray-500 text-xs">Unknown</span>}</p></div>
                            </div>
                            {freelancer.skills && freelancer.skills.length > 0 && (
                              <div className="mb-5"><p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Skills</p><div className="flex flex-wrap gap-1.5">{freelancer.skills.slice(0, 3).map((skill, idx) => <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-300">{skill}</span>)}{freelancer.skills.length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-300">+{freelancer.skills.length - 3}</span>}</div></div>
                            )}
                            <div className="flex gap-3 mt-6 pt-3 border-t border-white/10">
                              <button onClick={() => navigate(`/freelancer/${freelancer._id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-gray-200 hover:bg-indigo-500/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Profile
                              </button>
                              <button disabled={isInvited} onClick={() => onInviteClick(freelancer.userId || freelancer._id)} className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isInvited ? 'bg-green-500/20 text-green-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 text-white'}`}>
                                {isInvited ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Invited</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>Invite</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'invitations' && (
              <>
                {loadingInvitations ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No invitations found</h3>
                    <p className="text-gray-400 mb-6">You haven't received any team invitations yet.</p>
                    <button onClick={() => setActiveTab('freelancers')} className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
                      Browse Freelancers
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-400 mb-4">Showing {invitations.length} invitations</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {invitations.map((inv) => {
                        const sender = inv.invitedBy || inv.team || { name: 'Unknown Team', avatar: '' };
                        const statusColors = { pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', accepted: 'bg-green-500/20 text-green-300 border-green-500/30', rejected: 'bg-red-500/20 text-red-300 border-red-500/30' };
                        return (
                          <div key={inv._id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-white/10 hover:border-indigo-500/40 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-md">
                                {sender.avatar ? <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-lg">{getInitials(sender.name)}</span>}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{sender.name}</h3>
                                <p className="text-xs text-gray-400">Invited by {sender.name}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[inv.status]}`}>{inv.status.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div><p className="text-xs text-gray-500">Email</p><p className="text-gray-300 truncate">{sender.email || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-300">{sender.phone || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Location</p><p className="text-gray-300">{sender.location || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Invitation Date</p><p className="text-gray-300">{new Date(inv.createdAt).toLocaleDateString()}</p></div>
                            </div>
                            {sender.skills && sender.skills.length > 0 && (
                              <div className="mb-4"><p className="text-xs text-gray-500 mb-1">Skills</p><div className="flex flex-wrap gap-1">{sender.skills.slice(0, 3).map((s, i) => <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-300">{s}</span>)}{sender.skills.length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-300">+{sender.skills.length - 3}</span>}</div></div>
                            )}
                            <div className="flex gap-3 mt-2 pt-3 border-t border-white/10">
                              {inv.status === 'pending' && (
                                <>
                                  <button onClick={() => handleAcceptInvite(inv._id)} className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm font-medium">Accept</button>
                                  <button onClick={() => handleRejectInvite(inv._id)} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm font-medium">Reject</button>
                                  <button onClick={() => navigate(`/team/${inv._id}`)} className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-indigo-500/20 transition-colors">View Profile</button>
                                </>
                              )}
                              {inv.status === 'accepted' && (
                                <>
                                  <button onClick={() => navigate(`/team/${inv._id}`)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-indigo-500/20 transition-colors">View Profile</button>
                                  <button onClick={() => handleChat(inv)} className="flex-1 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors">Chat</button>
                                </>
                              )}
                              {inv.status === 'rejected' && (
                                <button onClick={() => navigate(`/team/${inv._id}`)} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-indigo-500/20 transition-colors">View Profile</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal isOpen={showAddMember} onClose={() => setShowAddMember(false)} onSubmit={handleAddMemberSubmit} isLoading={addMemberLoading} />
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-slideUp">
          <div className={`px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium ${toastMessage.type === 'success' ? 'bg-green-500/90 text-white border border-green-400' : 'bg-red-500/90 text-white border border-red-400'}`}>{toastMessage.text}</div>
        </div>
      )}
    </>
  );
};