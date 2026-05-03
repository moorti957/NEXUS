// pages/CreateProject.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import { useSocket } from '../socket/context/SocketContext';
import api from '../services/api';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';

const CreateProject = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const socket = useSocket();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    priority: 'Medium',
    startDate: '',
    deadline: '',
    budget: '',
    client: '',
    projectManager: '',
    technologies: [],
    features: [],
    teamMembers: [],
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [featureInput, setFeatureInput] = useState({ name: '', description: '' });
  const [teamMemberInput, setTeamMemberInput] = useState({ user: '', role: 'Developer' });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch clients and users on mount
 useEffect(() => {
  const fetchData = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        api.get('/clients'),
        api.get("/users")
      ]);

      if (clientsRes.data.success) {
        setClients(clientsRes.data.data.clients || []);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users || []);
      }

    } catch (error) {
      showToast('Failed to load required data', 'error');
    }
  };

  fetchData();
}, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Add technology
  const addTechnology = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()],
      }));
      setTechInput('');
    }
  };

  const removeTechnology = (tech) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  // Add feature
  const addFeature = () => {
    if (featureInput.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [
          ...prev.features,
          {
            name: featureInput.name.trim(),
            description: featureInput.description.trim(),
            status: 'Pending',
          },
        ],
      }));
      setFeatureInput({ name: '', description: '' });
    }
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Add team member
  const addTeamMember = () => {
  if (!teamMemberInput.user) return;

  // Check if already added
  const alreadyAdded = formData.teamMembers.some(
    (member) => member.user === teamMemberInput.user
  );

  if (alreadyAdded) {
    showToast("User already added to team", "warning");
    return;
  }

  const user = users.find((u) => u._id === teamMemberInput.user);

  if (user) {
    setFormData((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          user: teamMemberInput.user,
          role: teamMemberInput.role,
          hoursAllocated: 0, // default
        },
      ],
    }));

    // Reset input
    setTeamMemberInput({ user: "", role: "Developer" });

    showToast(`${user.name} added to team`, "success");
  }
};

  const removeTeamMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((tm) => tm.user !== userId),
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    else if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';

    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';

    if (!formData.category) newErrors.category = 'Category is required';

    if (!formData.startDate) newErrors.startDate = 'Start date is required';

    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    else if (new Date(formData.deadline) <= new Date(formData.startDate)) {
      newErrors.deadline = 'Deadline must be after start date';
    }

    if (!formData.budget) newErrors.budget = 'Budget is required';
    else if (isNaN(formData.budget) || Number(formData.budget) < 0) {
      newErrors.budget = 'Budget must be a positive number';
    }

    if (!formData.client) newErrors.client = 'Client is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);

    try {
      // Prepare data: convert budget to number, ensure dates are ISO strings
      const selectedClient = clients.find(
  (c) => c._id === formData.client
);

const payload = {
  ...formData,
  clientName: selectedClient?.name,
  clientEmail: selectedClient?.email,
  budget: Number(formData.budget),
  startDate: new Date(formData.startDate).toISOString(),
  deadline: new Date(formData.deadline).toISOString(),
  technologies: formData.technologies,
  features: formData.features,
  teamMembers: formData.teamMembers,
};

// ❗ projectManager empty हो तो remove कर दो
if (!formData.projectManager) {
  delete payload.projectManager;
}
console.log("Payload:", payload);

      const response = await api.post('/projects', payload);

      if (response.data.success) {
        showToast('Project created successfully!', 'success');

        // Emit socket event for real-time update
        if (socket?.isConnected) {
          socket.emit('project:created', {
  project: response.data.data.project,
});     
        }

        // Redirect to project detail or dashboard
        navigate(`/projects/${response.data.data.project._id}`);
      }
    } catch (error) {
       console.log("FULL ERROR:", error);
console.log("BACKEND RESPONSE:", error.response?.data);
console.log(
  "ERROR ARRAY:",
  JSON.stringify(error.response?.data?.errors, null, 2)
);
       const message = error.response?.data?.message || 'Failed to create project';
      showToast(message, 'error');

      // Handle field validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Reveal>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Create New <span className="gradient-text">Project</span>
          </h1>
          <p className="text-gray-400 mb-12">Fill in the details to start a new project</p>
        </Reveal>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Information */}
          <Reveal>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📋</span> Project Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.name ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                    placeholder="e.g., Company Website Redesign"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.description ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                    placeholder="Describe the project goals and scope..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.category ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                  >
                    <option value="">Select category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Brand Identity">Brand Identity</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Custom Software">Custom Software</option>
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Client Information */}
          <Reveal delay={100}>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">👤</span> Client Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Client */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-2">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.client ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.client && <p className="mt-1 text-sm text-red-400">{errors.client}</p>}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Budget & Timeline */}
          <Reveal delay={200}>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">💰</span> Budget & Timeline
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Budget ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.budget ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                    placeholder="e.g., 5000"
                  />
                  {errors.budget && <p className="mt-1 text-sm text-red-400">{errors.budget}</p>}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.startDate ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>}
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.deadline ? 'border-red-500' : 'border-white/10'
                    } focus:border-indigo-500 focus:outline-none transition-all`}
                  />
                  {errors.deadline && <p className="mt-1 text-sm text-red-400">{errors.deadline}</p>}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Team Assignment */}
          <Reveal delay={300}>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">👥</span> Team Assignment
              </h2>

              {/* Project Manager */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Project Manager</label>
                <select
                  name="projectManager"
                  value={formData.projectManager}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="">Select project manager</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role || 'No role'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm font-medium mb-2">Team Members</label>
                <div className="flex gap-2 mb-4">
                  <select
                    value={teamMemberInput.user}
                    onChange={(e) => setTeamMemberInput({ ...teamMemberInput, user: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={teamMemberInput.role}
                    onChange={(e) => setTeamMemberInput({ ...teamMemberInput, role: e.target.value })}
                    className="w-40 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Strategist">Strategist</option>
                    <option value="Tester">Tester</option>
                  </select>
                  <Button type="button" onClick={addTeamMember} size="sm">
                    Add
                  </Button>
                </div>

                {/* List of added team members */}
                <div className="space-y-2">
                  {formData.teamMembers.map((member, idx) => {
                    const user = users.find((u) => u._id === member.user);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div>
                          <span className="font-medium">{user?.name || 'Unknown'}</span>
                          <span className="ml-2 text-sm text-gray-400">({member.role})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(member.user)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Technologies & Features */}
          <Reveal delay={400}>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚙️</span> Technologies & Features
              </h2>

              {/* Technologies */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Technologies</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="e.g., React, Node.js, MongoDB"
                  />
                  <Button type="button" onClick={addTechnology} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm flex items-center gap-1"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-2">Features</label>
                <div className="grid md:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput.name}
                    onChange={(e) => setFeatureInput({ ...featureInput, name: e.target.value })}
                    placeholder="Feature name"
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={featureInput.description}
                    onChange={(e) => setFeatureInput({ ...featureInput, description: e.target.value })}
                    placeholder="Brief description"
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex justify-end mb-4">
                  <Button type="button" onClick={addFeature} size="sm">
                    Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        {feature.description && (
                          <span className="ml-2 text-sm text-gray-400">- {feature.description}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form Actions */}
          <Reveal delay={500}>
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="glass"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
             <Button type="submit" loading={loading} disabled={loading}>
  Create Project
</Button>
            </div>
          </Reveal>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;