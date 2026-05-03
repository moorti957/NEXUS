import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import ChatModal from "../components/chat/ChatModal";

const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
};

// Role-based gradient mapping
const roleGradients = {
  admin: {
    from: "from-purple-600",
    to: "to-pink-600",
    light: "from-purple-500/20 to-pink-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
    button: "from-purple-500 to-pink-600",
  },
  manager: {
    from: "from-indigo-600",
    to: "to-blue-600",
    light: "from-indigo-500/20 to-blue-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    button: "from-indigo-500 to-blue-600",
  },
  developer: {
    from: "from-emerald-600",
    to: "to-teal-600",
    light: "from-emerald-500/20 to-teal-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    button: "from-emerald-500 to-teal-600",
  },
  designer: {
    from: "from-pink-600",
    to: "to-rose-600",
    light: "from-pink-500/20 to-rose-500/20",
    text: "text-pink-400",
    border: "border-pink-500/30",
    button: "from-pink-500 to-rose-600",
  },
  default: {
    from: "from-indigo-600",
    to: "to-purple-600",
    light: "from-indigo-500/20 to-purple-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    button: "from-indigo-500 to-purple-600",
  },
};

export default function TeamMemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);
const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const openChat = (member) => {
  setChatUser(member);
  setShowChatModal(true);
};

  const fetchMember = async () => {
    try {
      const res = await api.get(`/team/${id}`);
      if (res.data.success) {
        setMember(res.data.data.member);
      }
    } catch (err) {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // Determine gradient based on role
  const roleKey = member?.role?.toLowerCase() || "default";
  const gradient = roleGradients[roleKey] || roleGradients.default;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 animate-pulse">
          {/* Back button placeholder */}
          <div className="h-10 w-24 bg-white/10 rounded-lg mb-6" />

          {/* Profile card skeleton */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
            <div className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col md:flex-row gap-6 -mt-12">
                <div className="w-28 h-28 rounded-full border-4 border-gray-900 bg-white/10" />
                <div className="flex-1 space-y-3 mt-4 md:mt-0">
                  <div className="h-8 bg-white/10 rounded w-48" />
                  <div className="h-4 bg-white/10 rounded w-32" />
                  <div className="h-4 bg-white/10 rounded w-40" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/10" />
            ))}
          </div>

          {/* Bio and projects skeleton */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 h-40 bg-white/5 rounded-2xl border border-white/10" />
            <div className="h-40 bg-white/5 rounded-2xl border border-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
          <p className="text-7xl mb-4">👤</p>
          <p className="text-gray-400 text-lg">User not found</p>
          <Button variant="glass" onClick={() => navigate(-1)} className="mt-6">
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back button */}
        <Button
          variant="glass"
          onClick={() => navigate(-1)}
          className="mb-6 hover:scale-105 transition-transform group"
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back
        </Button>

        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Cover image with dynamic gradient */}
          <div className={`h-32 bg-gradient-to-r ${gradient.from} ${gradient.to}`} />

          <div className="px-6 sm:px-8 pb-8">
            {/* Avatar and header row */}
            <div className="flex flex-col md:flex-row gap-6 -mt-12">
              <div className="relative">
                <img
                  src={member.avatar || getAvatarUrl(member.name)}
                  alt={member.name}
                  className={`w-28 h-28 rounded-full border-4 border-gray-900 object-cover shadow-xl ring-4 ring-white/10 ${gradient.light}`}
                />
                {/* Status indicator */}
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                    member.status === "online"
                      ? "bg-green-500"
                      : member.status === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                  }`}
                />
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 md:mt-0">
                <div>
                  <h1 className="text-3xl font-bold text-white">{member.name}</h1>
                  <p className={`${gradient.text} mt-1 font-medium`}>{member.role}</p>
                  <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                    <span>📧</span> {member.email}
                  </p>
                </div>

                <Button
  onClick={() => openChat(member)}
  className={`self-start md:self-center whitespace-nowrap bg-gradient-to-r ${gradient.button} hover:shadow-lg transition-all duration-300`}
>
  💬 Send Message
</Button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className={`bg-white/10 rounded-2xl p-4 border ${gradient.border} hover:bg-white/20 transition-all duration-300 group`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                  <div>
                    <p className="text-gray-400 text-xs">Projects</p>
                    <p className="text-2xl font-semibold">{member.projects?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className={`bg-white/10 rounded-2xl p-4 border ${gradient.border} hover:bg-white/20 transition-all duration-300 group`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">✅</span>
                  <div>
                    <p className="text-gray-400 text-xs">Tasks Done</p>
                    <p className="text-2xl font-semibold">{member.tasksCompleted || 0}</p>
                  </div>
                </div>
              </div>
              <div className={`bg-white/10 rounded-2xl p-4 border ${gradient.border} hover:bg-white/20 transition-all duration-300 group`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">⏳</span>
                  <div>
                    <p className="text-gray-400 text-xs">Hours Logged</p>
                    <p className="text-2xl font-semibold">{member.hoursLogged || 120}</p>
                  </div>
                </div>
              </div>
              <div className={`bg-white/10 rounded-2xl p-4 border ${gradient.border} hover:bg-white/20 transition-all duration-300 group`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
                  <div>
                    <p className="text-gray-400 text-xs">Achievements</p>
                    <p className="text-2xl font-semibold">{member.achievements || 5}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information & Bio Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Left column: Contact info */}
          <div className="lg:col-span-1 space-y-4">
            <div className={`p-6 rounded-2xl bg-white/5 border ${gradient.border} hover:shadow-lg transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📞</span>
                <h3 className="font-medium text-white">Contact</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-300">
                  <span className="text-gray-500 text-sm block">Phone</span>
                  {member.phone || "Not provided"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500 text-sm block">Location</span>
                  {member.location || "Unknown"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500 text-sm block">Joined</span>
                  {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Social links if available */}
            {member.socialLinks && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">🔗</span>
                  <h3 className="font-medium text-white">Social</h3>
                </div>
                <div className="flex gap-3">
                  {member.socialLinks.twitter && (
                    <a href={member.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">𝕏</a>
                  )}
                  {member.socialLinks.linkedin && (
                    <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">🔗</a>
                  )}
                  {member.socialLinks.github && (
                    <a href={member.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">💻</a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Bio and Skills */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className={`p-6 rounded-2xl bg-white/5 border ${gradient.border} hover:shadow-lg transition-all duration-300`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📝</span>
                <h3 className="text-lg font-bold text-white">About</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {member.bio || "No bio provided"}
              </p>
            </div>

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className={`p-6 rounded-2xl bg-white/5 border ${gradient.border}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-lg font-bold text-white">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 bg-gradient-to-r ${gradient.light} ${gradient.text} rounded-full text-sm border ${gradient.border}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Projects (if available) */}
            {member.recentProjects && member.recentProjects.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🚀</span>
                  <h3 className="text-lg font-bold text-white">Recent Projects</h3>
                </div>
                <div className="space-y-3">
                  {member.recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <span className="font-medium">{project.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Background grid pattern style */}
        <style jsx>{`
          .bg-grid-pattern {
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
          }
        `}</style>
      </div>
      
      {showChatModal && chatUser && (
  <ChatModal
    user={chatUser}
    onClose={() => setShowChatModal(false)}
  />
)}
    </div>
    

  );
}