// src/pages/ProjectWorkspace.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save, Eye, EyeOff, ExternalLink, Copy, Edit, CheckCircle,
    AlertTriangle, Calendar, DollarSign, Clock, Users, Layers,
    MessageSquare, FileText, GitBranch, TrendingUp, Zap,
    PlusCircle, Upload, Send, RefreshCw, X, Trash2
} from "lucide-react";
import Reveal from "../components/common/Reveal";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import api from "../services/api";
import ProjectUpdateTimeline from "../components/projects/ProjectUpdateTimeline";
import MilestoneManager from "../components/projects/MilestoneManager";
import ProjectHealthPanel from "../components/projects/ProjectHealthPanel";
import QuickActionsPanel from "../components/projects/QuickActionsPanel";

// Helper for date formatting
const formatDate = (date) => new Date(date).toLocaleDateString();

export default function ProjectWorkspace() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Mode: view or edit
    const [mode, setMode] = useState("edit"); // "view" or "edit"
    const [loading, setLoading] = useState(false);
    const [notifyClient, setNotifyClient] = useState(true);

    // Project data (from location state or fetch)
    const [project, setProject] = useState(location.state?.project || null);
    const [originalProject, setOriginalProject] = useState(null);

    // Editable fields
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        priority: "",
        deadline: "",
        budget: "",
        status: "",
        progress: 0,
        currency: "USD",
    });

    // Live links
    const [liveLinks, setLiveLinks] = useState({
        livePreview: "",
        github: "",
        figma: "",
        staging: "",
        clientReview: "",
    });

    // Activity log (last updated)
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch project if not passed via state
    useEffect(() => {
        if (!project) {
            fetchProject();
        } else {
            initializeFromProject(project);
        }
    }, [project]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projects/${id}`);
            if (res.data.success) {
                const proj = res.data.data.project;
                setProject(proj);
                initializeFromProject(proj);
            }
        } catch (err) {
            showToast("Failed to load project", "error");
        } finally {
            setLoading(false);
        }
    };

    const initializeFromProject = (proj) => {
        setFormData({
            name: proj.name || "",
            description: proj.description || "",
            category: proj.category || "",
            priority: proj.priority || "Medium",
            deadline: proj.deadline ? proj.deadline.split("T")[0] : "",
            budget: proj.budget || "",
            status: proj.status || "Planning",
            progress: proj.progress || 0,
            currency: proj.currency || "USD",
        });
        setLiveLinks({
            livePreview: proj.livePreviewUrl || "",
            github: proj.githubRepo || "",
            figma: proj.figmaLink || "",
            staging: proj.stagingLink || "",
            clientReview: proj.clientReviewLink || "",
        });
        setOriginalProject(proj);
        setLastUpdated(proj.updatedAt ? new Date(proj.updatedAt) : new Date());
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (key, value) => {
        setLiveLinks((prev) => ({ ...prev, [key]: value }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard", "success");
    };

    const BackgroundDecorations = () => {
        return (
            <>
                {/* base */}
                <div className="fixed inset-0 bg-[#090B14] -z-20" />

                {/* subtle grid */}
                <div
                    className="fixed inset-0 -z-10 opacity-40"
                    style={{
                        backgroundImage: `
   linear-gradient(rgba(88,101,242,.06) 1px, transparent 1px),
   linear-gradient(90deg, rgba(88,101,242,.06) 1px, transparent 1px)
  `,
                        backgroundSize: "62px 62px"
                    }}
                />

                {/* TOP CENTER GLOW like screenshot */}
                <div className="
fixed
top-[-180px]
left-1/2
-translate-x-1/2
w-[900px]
h-[500px]
bg-indigo-500/12
blur-[170px]
-z-10
"/>

                {/* soft left vertical wash */}
                <div className="
fixed
top-0
left-0
w-[340px]
h-full
bg-indigo-500/6
blur-[120px]
-z-10
"/>

                {/* soft right vertical wash */}
                <div className="
fixed
top-0
right-0
w-[340px]
h-full
bg-purple-500/6
blur-[120px]
-z-10
"/>

                {/* center spotlight */}
                <div className="
fixed
top-[25%]
left-1/2
-translate-x-1/2
w-[700px]
h-[400px]
bg-violet-500/8
blur-[140px]
-z-10
"/>

                {/* vignette edges */}
                <div className="
fixed inset-0 -z-10 pointer-events-none
bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,.35)_100%)]
"/>

            </>
        )
    }

    const saveChanges = async () => {
        try {
            setLoading(true);
            const payload = {
                ...formData,
                livePreviewUrl: liveLinks.livePreview,
                githubRepo: liveLinks.github,
                figmaLink: liveLinks.figma,
                stagingLink: liveLinks.staging,
                clientReviewLink: liveLinks.clientReview,
                notifyClient,
            };
            const res = await api.put(`/projects/${id}`, payload);
            if (res.data.success) {
                showToast("Project updated successfully", "success");
                setLastUpdated(new Date());
                if (notifyClient) {
                    // Optional: trigger notification
                    showToast("Client notified about changes", "info");
                }
            }
        } catch (err) {
            showToast("Update failed", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
       <div className="relative">
   <BackgroundDecorations />

   <div className="relative z-10 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
                    {/* Header with mode toggle */}
                    <Reveal>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold">Project Workspace</h1>
                                <p className="text-gray-400 text-sm mt-1">{project?.name}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant={mode === "edit" ? "primary" : "glass"}
                                    onClick={() => setMode(mode === "edit" ? "view" : "edit")}
                                >
                                    {mode === "edit" ? <Eye className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                    {mode === "edit" ? "View Mode" : "Edit Mode"}
                                </Button>
                                <Button variant="glass" onClick={() => navigate(`/projects/${id}`)}>
                                    Back to Project
                                </Button>
                            </div>
                        </div>
                    </Reveal>

                    {/* Main 2-column layout */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left column (2/3 width) */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Overview Editor */}
                            <Reveal>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold">Project Overview</h2>
                                        {lastUpdated && (
                                            <span className="text-xs text-gray-400">
                                                Last updated: {lastUpdated.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {mode === "edit" ? (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                                                    <input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                                    <input
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Priority</label>
                                                    <select
                                                        name="priority"
                                                        value={formData.priority}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                                                    >
                                                        <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                                    <select
                                                        name="status"
                                                        value={formData.status}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                                                    >
                                                        <option>Planning</option><option>In Progress</option><option>Review</option><option>Completed</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Deadline</label>
                                                    <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Budget ({formData.currency})</label>
                                                    <input name="budget" value={formData.budget} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                                <textarea
                                                    name="description"
                                                    rows="3"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Progress: {formData.progress}%</label>
                                                <input
                                                    type="range"
                                                    name="progress"
                                                    min="0"
                                                    max="100"
                                                    value={formData.progress}
                                                    onChange={handleInputChange}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} />
                                                    Notify client about these changes
                                                </label>
                                                <Button onClick={saveChanges} loading={loading}>
                                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p><span className="text-gray-400">Name:</span> {formData.name}</p>
                                            <p><span className="text-gray-400">Description:</span> {formData.description}</p>
                                            <p><span className="text-gray-400">Category:</span> {formData.category}</p>
                                            <p><span className="text-gray-400">Priority:</span> {formData.priority}</p>
                                            <p><span className="text-gray-400">Status:</span> {formData.status}</p>
                                            <p><span className="text-gray-400">Deadline:</span> {formatDate(formData.deadline)}</p>
                                            <p><span className="text-gray-400">Budget:</span> {formData.currency} {formData.budget}</p>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: `${formData.progress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Reveal>

                            {/* Live Links Section */}
                            <Reveal>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4">Live Project Links</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {Object.entries(liveLinks).map(([key, value]) => (
                                            <div key={key} className="p-3 rounded-xl bg-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    {mode === "edit" ? (
                                                        <button onClick={() => handleLinkChange(key, prompt("Enter URL:", value) || value)} className="text-indigo-400">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                                {value ? (
                                                    <div className="flex gap-2">
                                                        <a href={value} target="_blank" className="text-indigo-400 text-sm truncate flex-1">{value}</a>
                                                        <button onClick={() => copyToClipboard(value)}><Copy className="w-4 h-4" /></button>
                                                        <a href={value} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">Not set</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>

                            {/* Progress Update Timeline (reusable) */}
                            <ProjectUpdateTimeline projectId={id} mode={mode} />

                            {/* Milestones Management */}
                            <MilestoneManager projectId={id} mode={mode} />

                            {/* Task Board (Kanban) */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-bold mb-4">Task / Work Log Board</h3>
                                {mode === "edit" && (
                                    <Button variant="glass" className="mb-4" onClick={() => showToast("Add task form (demo)")}>
                                        <PlusCircle className="w-4 h-4 mr-2" /> Add Task
                                    </Button>
                                )}
                                <div className="grid md:grid-cols-4 gap-4">
                                    {["Todo", "In Progress", "Review", "Done"].map((column) => (
                                        <div key={column} className="bg-white/5 rounded-xl p-3">
                                            <h4 className="font-medium mb-2">{column}</h4>
                                            <div className="space-y-2">
                                                {/* Example static tasks - in real app map from state */}
                                                <div className="p-2 bg-white/10 rounded-lg text-sm">Sample task</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Client Communication Panel */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Client Communication</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm">📝 Feedback: Client approved wireframes</p>
                                        <span className="text-xs text-gray-500">2 hours ago</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm">🔄 Revision requested: Update color scheme</p>
                                        <span className="text-xs text-gray-500">Yesterday</span>
                                    </div>
                                </div>
                                {mode === "edit" && (
                                    <div className="mt-4 flex gap-2">
                                        <input type="text" placeholder="Write a note or feedback..." className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
                                        <Button variant="glass">Send</Button>
                                    </div>
                                )}
                            </div>

                            {/* Resource & Deliverables */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Deliverables</h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {["Design_Files.zip", "Source_Code.zip", "Invoice_123.pdf"].map((file) => (
                                        <div key={file} className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                                            <span className="text-sm">{file}</span>
                                            <Button variant="glass" size="sm">Download</Button>
                                        </div>
                                    ))}
                                </div>
                                {mode === "edit" && (
                                    <Button variant="glass" className="mt-4"><Upload className="w-4 h-4 mr-2" /> Upload Deliverable</Button>
                                )}
                            </div>

                            {/* Change History / Audit Log */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-bold mb-4">Audit Log</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Freelancer updated progress to 65%</span><span className="text-gray-500">2h ago</span></div>
                                    <div className="flex justify-between"><span>Client requested revision on homepage</span><span className="text-gray-500">1d ago</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Right column (1/3 width) - Sticky Sidebar */}
                        <div className="space-y-8">
                            {/* Project Health Dashboard */}
                            <ProjectHealthPanel project={project} formData={formData} />

                            {/* Quick Actions Panel */}
                            <QuickActionsPanel projectId={id} mode={mode} />

                            {/* Notify toggle & extra */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} disabled={mode !== "edit"} />
                                    Notify client on important edits
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}