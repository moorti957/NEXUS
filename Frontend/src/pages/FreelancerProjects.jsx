// src/pages/FreelancerProjects.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../socket/context/SocketContext';
import { useToast } from '../components/common/Toast';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import EnhancedProjectCard from '../components/projects/EnhancedProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import api from '../services/api';

export default function FreelancerProjects() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast } = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, completedProjects: 0 });

    useEffect(() => {
        fetchProjects();
    }, [user]);

    // Real‑time progress updates from socket
    useEffect(() => {
        if (!socket) return;
        const handleProgressUpdate = ({ projectId, newProgress }) => {
            setProjects(prev =>
                prev.map(p => p._id === projectId ? { ...p, progress: newProgress } : p)
            );
            showToast(`Project progress updated to ${newProgress}%`, 'info');
        };
        socket.on('project:progress-updated', handleProgressUpdate);
        return () => socket.off('project:progress-updated', handleProgressUpdate);
    }, [socket, showToast]);

    const fetchProjects = async () => {
        try {

            setLoading(true);

            const res = await api.get('/projects');

            console.log(
                "PROJECT API:",
                res.data
            );

            if (res.data.success) {

                let projectsData =
                    res.data.data;

                // normalize response
                if (
                    !Array.isArray(projectsData)
                ) {
                    projectsData =
                        projectsData?.projects ||
                        projectsData?.docs ||
                        [];
                }

                projectsData =
                    Array.isArray(projectsData)
                        ? projectsData
                        : [];

                setProjects(projectsData);


                setStats({
                    totalProjects:
                        projectsData.length,

                    activeProjects:
                        projectsData.filter(
                            p => p.status === 'In Progress'
                        ).length,

                    completedProjects:
                        projectsData.filter(
                            p => p.status === 'Completed'
                        ).length
                });

            }

        } catch (error) {

            console.error(
                'Failed to fetch projects:',
                error
            );

            showToast(
                'Failed to load projects',
                'error'
            );

            setProjects([]);

        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreated = (newProject) => {
        setProjects(prev => [newProject, ...prev]);
        setStats(prev => ({
            totalProjects: prev.totalProjects + 1,
            activeProjects: prev.activeProjects + 1,
            completedProjects: prev.completedProjects,
        }));
        showToast(`Project "${newProject.name}" created`, 'success');
    };

    const handleProgressUpdate = async (projectId, newProgress) => {
        // Optimistic update
        setProjects(prev => prev.map(p => p._id === projectId ? { ...p, progress: newProgress } : p));
        // Emit via socket for real‑time sync (client portal will hear it)
        socket?.emit('project:progress-updated', { projectId, newProgress });
        // Also call API to persist
        try {
            await api.put(`/projects/${projectId}/progress`, { progress: newProgress });
        } catch (err) {
            console.error('Failed to save progress', err);
            showToast('Progress update failed on server', 'error');
            // Revert optimistic update? optional
            fetchProjects();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-[#13131A]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header with stats */}
                <Reveal>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold font-display">
                                My <span className="gradient-text">Projects</span>
                            </h1>
                            <p className="text-gray-400 mt-2">Manage all your freelance projects, track progress, and collaborate with clients.</p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>+ New Project</Button>
                    </div>
                </Reveal>

                {/* Stats cards */}
                <Reveal delay={200}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-3xl font-bold gradient-text">{stats.totalProjects}</div>
                            <div className="text-gray-400">Total Projects</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-3xl font-bold text-blue-400">{stats.activeProjects}</div>
                            <div className="text-gray-400">Active Projects</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-3xl font-bold text-green-400">{stats.completedProjects}</div>
                            <div className="text-gray-400">Completed</div>
                        </div>
                    </div>
                </Reveal>

                {/* Projects list */}
                <Reveal delay={400}>
                    <div className="space-y-6">
                        {projects.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-xl mb-4">No projects yet</p>
                                <Button onClick={() => setShowCreateModal(true)}>Create your first project</Button>
                            </div>
                        ) : (
                            projects.map(project => (
                                <EnhancedProjectCard
                                    key={project._id}
                                    project={project}
                                    onProgressUpdate={handleProgressUpdate}
                                />
                            ))
                        )}
                    </div>
                </Reveal>

                {/* Create modal */}
                {showCreateModal && (
                    <CreateProjectModal
                        onClose={() => setShowCreateModal(false)}
                        onProjectCreated={handleProjectCreated}
                    />
                )}
            </div>
        </div>
    );
}