// src/pages/ClientPortal.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, AlertCircle, Users, FileText, DollarSign,
  Calendar, TrendingUp, UserCheck, Briefcase, Layers, Link as LinkIcon,
  MessageSquare, ThumbsUp, RotateCcw, Eye, Download, CheckSquare,
  BarChart3, PlayCircle, Circle, CircleCheckBig, GitBranch, Zap
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../socket/context/SocketContext';
import { useToast } from '../components/common/Toast';
import api from '../services/api';
import Button from '../components/common/Button';
import Reveal from '../components/common/Reveal';
import ProjectProgressTracker from '../components/projects/ProjectProgressTracker';

// Helper to get avatar URL
const getAvatarUrl = (avatar, name) => {
  if (!avatar) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
  if (avatar.startsWith('http')) return avatar;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${avatar}`;
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
};

// ==================== BACKGROUND DECORATIONS ====================
const BackgroundDecorations = () => {
  // Grid pattern (engineering math notebook style)
  const gridPattern = {
    backgroundImage: `
      linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
  };

  // Floating geometric elements
  const floatingBoxes = [
    { width: 120, height: 120, top: '15%', left: '5%', delay: 0, duration: 20 },
    { width: 180, height: 180, bottom: '20%', right: '3%', delay: 2, duration: 25 },
    { width: 80, height: 80, top: '40%', right: '15%', delay: 1, duration: 18 },
    { width: 60, height: 60, bottom: '35%', left: '10%', delay: 3, duration: 22 },
    { width: 100, height: 100, top: '70%', left: '20%', delay: 0.5, duration: 30 },
  ];

  return (
    <>
      {/* Layer 1: Dark base (matches #13131A) */}
      <div className="fixed inset-0 bg-[#13131A] dark:bg-[#13131A] light:bg-gray-50 -z-10" />

      {/* Layer 2: Grid pattern */}
      <div className="fixed inset-0 -z-10" style={gridPattern} />

      {/* Layer 3: Ambient glows */}
      <div className="fixed inset-0 -z-10">
        {/* Left indigo glow */}
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        {/* Right purple glow */}
        <div className="absolute bottom-1/3 -right-48 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Top blue glow */}
        <div className="absolute -top-48 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#13131A] via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Layer 4: Floating geometric elements with motion */}
      {floatingBoxes.map((box, idx) => (
        <motion.div
          key={idx}
          className="fixed border border-indigo-500/10 rounded-xl pointer-events-none -z-5"
          style={{
            width: box.width,
            height: box.height,
            top: box.top,
            left: box.left,
            bottom: box.bottom,
            right: box.right,
            backdropFilter: 'blur(2px)',
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, idx % 2 === 0 ? 15 : -15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: box.duration,
            delay: box.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Dotted particle matrix (very subtle) */}
      <div className="fixed inset-0 -z-5 pointer-events-none">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.15) 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* Layer 5: Vignette edge fade (left & right) */}
      <div className="fixed inset-0 -z-5 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#13131A] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#13131A] to-transparent" />
      </div>
    </>
  );
};

// ==================== MAIN COMPONENT ====================
export default function ClientPortal() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Fetch client projects
  useEffect(() => {
    fetchClientProjects();
  }, [user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleProgressUpdate = ({ projectId, newProgress }) => {
      setProjects(prev => prev.map(p =>
        p._id === projectId ? { ...p, progress: newProgress } : p
      ));
      if (selectedProjectId === projectId) {
        showToast(`Project progress updated to ${newProgress}%`, 'info');
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on('project:progress-updated', handleProgressUpdate);
    socket.on('online-users', handleOnlineUsers);

    return () => {
      socket.off('project:progress-updated', handleProgressUpdate);
      socket.off('online-users', handleOnlineUsers);
    };
  }, [socket, selectedProjectId, showToast]);

  const fetchClientProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/client-projects');
      const projectsData = res.data.data || [];
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0]._id);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = useMemo(() =>
    projects.find(p => p._id === selectedProjectId), [projects, selectedProjectId]
  );

  // Calculate developer contributions
  const developerContributions = useMemo(() => {
    if (!selectedProject) return [];
    const members =
      selectedProject.teamMembers?.map(m => ({
        ...m.user,
        role: m.role
      })) ||
      selectedProject.assignedTeam ||
      [];
    const tasks = selectedProject.tasks || [];

    return members.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo?._id === member._id || t.assignedTo === member._id);
      const completed = memberTasks.filter(t => t.completed || t.status === 'Done').length;
      const total = memberTasks.length;
      const contribution = total === 0 ? 0 : Math.round((completed / total) * 100);
      const isWorking = memberTasks.some(t => t.status === 'In Progress');
      return {
        ...member,
        contribution,
        isWorking,
        tasksCompleted: completed,
        totalTasks: total
      };
    }).sort((a, b) => b.contribution - a.contribution);
  }, [selectedProject]);

  // Phase timeline
  const phases = ['Planning', 'Wireframing', 'Development', 'Testing', 'Deployment', 'Delivered'];
  const getPhaseStatus = (phase) => {
    const progress = selectedProject?.progress || 0;
    const phaseIndex = phases.indexOf(phase);
    if (progress >= (phaseIndex + 1) * 16.6) return 'completed';
    if (progress >= phaseIndex * 16.6) return 'current';
    return 'upcoming';
  };

  const handleApproveProgress = async () => {
    try {
      await api.post(`/projects/${selectedProjectId}/approve-progress`);
      showToast('Progress approved successfully', 'success');
    } catch (err) {
      showToast('Approval failed', 'error');
    }
  };

  const handleRequestRevision = () => {
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      await api.post(`/projects/${selectedProjectId}/feedback`, { message: feedbackText });
      showToast('Feedback sent to freelancer', 'success');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch (err) {
      showToast('Failed to send feedback', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BackgroundDecorations />
        <div className="relative z-10 w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="relative">
        <BackgroundDecorations />
        <div className="relative z-10 min-h-screen pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 text-center py-20">
            <div className="text-6xl mb-6">📁</div>
            <h2 className="text-2xl font-bold mb-2">No Projects Assigned</h2>
            <p className="text-gray-400">You don't have any active projects yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background Layer (behind everything) */}
      <BackgroundDecorations />

      {/* Main Content (preserved exactly as original) */}
      <div className="relative z-10 min-h-screen pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* ========== HERO HEADER ========== */}
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold font-display">
                    Client <span className="gradient-text">Portal</span>
                  </h1>
                  <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {isConnected ? 'Live' : 'Offline'}
                  </div>
                </div>
                <p className="text-gray-400">Real‑time project tracking & collaboration</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-sm text-gray-400">Active Projects</span>
                  <div className="text-2xl font-bold">{projects.length}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-sm text-gray-400">Client</span>
                  <div className="font-medium">{user?.name || 'Guest'}</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ========== PROJECT SELECTOR ========== */}
          <Reveal delay={100}>
            <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
              {projects.map(project => (
                <button
                  key={project._id}
                  onClick={() => setSelectedProjectId(project._id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap backdrop-blur-sm
                    ${selectedProjectId === project._id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </Reveal>

          {selectedProject && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProjectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* ========== PROJECT MASTER CARD ========== */}
                <Reveal type="scale">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-4">
                          <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium
                            ${selectedProject.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}
                            ${selectedProject.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : ''}
                            ${selectedProject.status === 'Review' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                            ${selectedProject.status === 'Planning' ? 'bg-purple-500/20 text-purple-400' : ''}
                          `}>
                            {selectedProject.status || 'Planning'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                            {selectedProject.category || 'General'}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-4">{selectedProject.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><span className="text-gray-500">Budget</span><p className="font-medium">{formatCurrency(selectedProject.budget)}</p></div>
                          <div><span className="text-gray-500">Payment Status</span><p className="font-medium">{selectedProject.paymentStatus || 'Pending'}</p></div>
                          <div><span className="text-gray-500">Deadline</span><p className="font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p></div>
                          <div><span className="text-gray-500">Project Type</span><p className="font-medium">{selectedProject.projectType || 'Fixed Price'}</p></div>
                        </div>
                      </div>
                      <div className="min-w-[160px]">
                        <ProjectProgressTracker progress={selectedProject.progress || 0} size={140} />
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* ========== ANALYTICS WIDGETS ROW ========== */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Tasks Completed', value: `${(selectedProject.tasks || []).filter(t => t.completed).length}/${(selectedProject.tasks || []).length}`, icon: CheckSquare, color: 'text-green-400' },
                    { label: 'Milestones', value: `${(selectedProject.milestones || []).filter(m => m.completed).length}/${(selectedProject.milestones || []).length}`, icon: CircleCheckBig, color: 'text-blue-400' },
                    { label: 'Days Remaining', value: Math.max(0, Math.ceil((new Date(selectedProject.deadline) - new Date()) / (1000 * 60 * 60 * 24))), icon: Calendar, color: 'text-yellow-400' },
                    { label: 'Budget Used', value: `${selectedProject.progress || 0}%`, icon: DollarSign, color: 'text-purple-400' },
                    { label: 'Hours Consumed', value: `${selectedProject.actualHours || 0}/${selectedProject.estimatedHours || 0}h`, icon: Clock, color: 'text-orange-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                      <div className="text-xl font-bold">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* LEFT COLUMN: Progress System + Team */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* ========== ADVANCED PROGRESS SYSTEM ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Progress Overview</h3>
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Overall Completion</span>
                            <span>{selectedProject.progress || 0}%</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedProject.progress || 0}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                            />
                          </div>
                        </div>

                        <h4 className="font-semibold mb-3 text-sm text-gray-300">Developer Contributions</h4>
                        <div className="space-y-4">
                          {developerContributions.map(dev => (
                            <div key={dev._id}>
                              <div className="flex justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  <img src={getAvatarUrl(dev.avatar, dev.name)} className="w-6 h-6 rounded-full" alt={dev.name} />
                                  <span>{dev.name}</span>
                                  {dev.isWorking && <Zap className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <span>{dev.contribution}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dev.contribution}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progress glow nodes */}
                        <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
                          {[0, 25, 50, 75, 100].map(threshold => (
                            <div key={threshold} className="text-center">
                              <div className={`w-3 h-3 rounded-full mx-auto mb-1 transition-all duration-300
                                ${(selectedProject.progress || 0) >= threshold ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`}
                              />
                              <span className="text-xs text-gray-500">{threshold}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>

                    {/* ========== TEAM COLLABORATION PANEL ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Assigned Team</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {developerContributions.map(member => (
                            <div key={member._id || member.user?._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                              <img src={getAvatarUrl(member.avatar, member.name)} className="w-10 h-10 rounded-full" />
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {member.name}
                                  {onlineUsers.includes(member._id) && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                </div>
                                <div className="text-xs text-gray-400">{member.role}</div>
                                <div className="text-xs text-indigo-400">{member.tasksCompleted}/{member.totalTasks} tasks</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-mono">{member.contribution}%</div>
                                {member.isWorking && <span className="text-xs text-yellow-400">Working</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>

                    {/* ========== COMMUNICATION SECTION ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Recent Updates</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {(selectedProject.updates || []).slice(0, 5).map((update, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-white/5 text-sm">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{update.author?.name || 'System'}</span>
                                <span>{new Date(update.createdAt).toLocaleString()}</span>
                              </div>
                              <p>{update.message}</p>
                            </div>
                          ))}
                          {(!selectedProject.updates || selectedProject.updates.length === 0) && (
                            <p className="text-gray-500 text-sm">No recent updates</p>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  </div>

                  {/* RIGHT COLUMN: Timeline, Live Preview, Approval */}
                  <div className="space-y-8">
                    {/* ========== PROJECT PHASE TIMELINE ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5" /> Project Timeline</h3>
                        <div className="space-y-3">
                          {phases.map((phase, idx) => {
                            const status = getPhaseStatus(phase);
                            return (
                              <div key={phase} className="flex items-center gap-3">
                                <div className="relative">
                                  {status === 'completed' && <CircleCheckBig className="w-5 h-5 text-green-400" />}
                                  {status === 'current' && <PlayCircle className="w-5 h-5 text-indigo-400 animate-pulse" />}
                                  {status === 'upcoming' && <Circle className="w-5 h-5 text-gray-500" />}
                                  {idx !== phases.length - 1 && <div className="absolute top-5 left-2 w-0.5 h-6 bg-white/10" />}
                                </div>
                                <span className={`text-sm ${status === 'completed' ? 'text-green-400 line-through' : status === 'current' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                  {phase}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Reveal>

                    {/* ========== LIVE PREVIEW BOX ========== */}
                    {selectedProject.livePreviewUrl && (selectedProject.progress >= 70 || selectedProject.status === 'Completed') && (
                      <Reveal>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/30 backdrop-blur-sm">
                          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Eye className="w-5 h-5" /> Live Preview</h3>
                          <p className="text-sm text-gray-300 mb-3">Project is ready to view</p>
                          <Button fullWidth onClick={() => window.open(selectedProject.livePreviewUrl, '_blank')}>
                            <LinkIcon className="w-4 h-4 mr-2" /> Open Preview ↗
                          </Button>
                        </div>
                      </Reveal>
                    )}

                    {/* ========== CLIENT APPROVAL MODULE ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5" /> Client Approval</h3>
                        <div className="space-y-3">
                          <Button fullWidth onClick={handleApproveProgress}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve Current Progress
                          </Button>
                          <Button variant="glass" fullWidth onClick={handleRequestRevision}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Request Revision
                          </Button>
                        </div>
                      </div>
                    </Reveal>

                    {/* ========== DOCUMENTS & INVOICES SNAPSHOT ========== */}
                    <Reveal>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Documents & Invoices</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(selectedProject.documents || []).slice(0, 3).map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                              <span className="text-sm truncate">{doc.name}</span>
                              <Button variant="glass" size="sm" onClick={() => window.open(doc.url)}>Download</Button>
                            </div>
                          ))}
                          {(!selectedProject.documents || selectedProject.documents.length === 0) && (
                            <p className="text-gray-500 text-sm">No documents uploaded</p>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </div>

                {/* ========== TASK CHECKLIST & FEATURES ========== */}
                <Reveal>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckSquare className="w-5 h-5" /> Task Checklist</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(selectedProject.tasks || []).map(task => (
                          <div key={task._id || task.title} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                            {task.completed ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-gray-500" />}
                            <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                            <span className="text-xs text-gray-500">{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                        ))}
                        {(selectedProject.tasks || []).length === 0 && <p className="text-gray-500">No tasks yet</p>}
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5" /> Features & Milestones</h3>
                      <div className="space-y-3">
                        {(selectedProject.features || []).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm">
                              {typeof feature === 'object' ? feature.title || feature.name : feature}
                            </span>
                          </div>
                        ))}
                        {(selectedProject.milestones || []).map(m => (
                          <div key={m._id || m.title} className="flex items-center gap-2">
                            {m.completed ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-gray-500" />}
                            <span className={`text-sm ${m.completed ? 'line-through text-gray-400' : ''}`}>{m.title}</span>
                          </div>
                        ))}
                        {(selectedProject.features?.length === 0 && selectedProject.milestones?.length === 0) && (
                          <p className="text-gray-500">No features/milestones defined</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ========== FEEDBACK MODAL ========== */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Request Revision</h3>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe what needs to be changed..."
                rows="4"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none mb-4"
              />
              <div className="flex gap-3">
                <Button onClick={submitFeedback}>Send Feedback</Button>
                <Button variant="glass" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}