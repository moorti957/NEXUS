// src/components/projects/CreateProjectModal.jsx
import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import api from '../../services/api';

export default function CreateProjectModal({ onClose, onProjectCreated }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    budget: '',
    deadline: '',
    livePreviewUrl: '',
    assignedTeam: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, teamRes] = await Promise.all([
          api.get('/clients/list'),
          api.get('/team/my-team')
        ]);
        setClients(clientsRes.data.data || []);
        setTeamMembers(teamRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', formData);
      showToast('Project created successfully', 'success');
      onProjectCreated(res.data.data);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Creation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      assignedTeam: prev.assignedTeam.includes(memberId)
        ? prev.assignedTeam.filter(id => id !== memberId)
        : [...prev.assignedTeam, memberId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-[#1a1a22] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Create New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select name="clientId" value={formData.clientId} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <option value="">Select client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget ($)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Live Preview URL</label>
              <input type="url" name="livePreviewUrl" value={formData.livePreviewUrl} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Assign Team</label>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map(m => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => handleTeamToggle(m._id)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${formData.assignedTeam.includes(m._id) ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>Create Project</Button>
            <Button type="button" variant="glass" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}