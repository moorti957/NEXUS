import { useState, useEffect, useRef, useCallback } from 'react';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES = [
  { id: 'development', label: 'Development', icon: '💻' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'branding', label: 'Branding', icon: '✨' },
  { id: 'consulting', label: 'Consulting', icon: '💡' },
];

const GRADIENT_PRESETS = [
  { label: 'Indigo → Purple', value: 'from-indigo-500 to-purple-600', light: 'from-indigo-500/10 to-purple-600/10' },
  { label: 'Purple → Pink', value: 'from-purple-500 to-pink-600', light: 'from-purple-500/10 to-pink-600/10' },
  { label: 'Pink → Orange', value: 'from-pink-500 to-orange-600', light: 'from-pink-500/10 to-orange-600/10' },
  { label: 'Orange → Yellow', value: 'from-orange-500 to-yellow-600', light: 'from-orange-500/10 to-yellow-600/10' },
  { label: 'Green → Teal', value: 'from-green-500 to-teal-600', light: 'from-green-500/10 to-teal-600/10' },
  { label: 'Blue → Indigo', value: 'from-blue-500 to-indigo-600', light: 'from-blue-500/10 to-indigo-600/10' },
  { label: 'Teal → Cyan', value: 'from-teal-500 to-cyan-600', light: 'from-teal-500/10 to-cyan-600/10' },
  { label: 'Red → Pink', value: 'from-red-500 to-pink-600', light: 'from-red-500/10 to-pink-600/10' },
];

const ICON_OPTIONS = [
  { id: 'code', label: 'Code', emoji: '💻' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'chart', label: 'Chart', emoji: '📊' },
  { id: 'brand', label: 'Brand', emoji: '✨' },
  { id: 'mobile', label: 'Mobile', emoji: '📱' },
  { id: 'consulting', label: 'Consulting', emoji: '🖥️' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀' },
  { id: 'shield', label: 'Shield', emoji: '🛡️' },
  { id: 'globe', label: 'Globe', emoji: '🌐' },
];

const ICON_MAP = {
  code: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  design: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  chart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  brand: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  mobile: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  consulting: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  star: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  rocket: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  globe: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const EMPTY_FORM = {
  title: '',
  description: '',
  longDescription: '',
  category: 'development',
  features: [],
  technologies: [],
  price: '',
  timeline: '',
  keywords: [],
  gradient: 'from-indigo-500 to-purple-600',
  lightGradient: 'from-indigo-500/10 to-purple-600/10',
  iconType: 'code',
  status: 'active',
};

// ─────────────────────────────────────────────
// SUB-COMPONENT: Tags Input
// ─────────────────────────────────────────────

function TagInput({ label, placeholder, tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="min-h-[48px] w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="hover:text-white transition-colors ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder-gray-600"
        />
      </div>
      <p className="text-xs text-gray-600 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: Service Card (mini preview)
// ─────────────────────────────────────────────

function ServiceCard({ service, onEdit, onDelete, onToggleStatus }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(service._id);
    setDeleting(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggleStatus(service._id);
    setToggling(false);
  };

  return (
    <div
      className={`
        relative p-5 rounded-2xl border transition-all duration-300
        bg-gradient-to-br ${service.lightGradient || 'from-indigo-500/10 to-purple-600/10'}
        ${service.status === 'inactive' ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-indigo-500/30'}
      `}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            service.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : service.status === 'draft'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {service.status}
        </span>
      </div>

      {/* Icon + Title */}
      <div className="flex items-center gap-3 mb-3 pr-16">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white flex-shrink-0`}
        >
          <div className="scale-75">{ICON_MAP[service.iconType] || ICON_MAP.code}</div>
        </div>
        <div>
          <h3 className="font-bold leading-tight">{service.title}</h3>
          <p className="text-xs text-gray-400 capitalize">{service.category}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{service.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        {service.technologies?.slice(0, 3).map((t) => (
          <span key={t} className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-400">
            {t}
          </span>
        ))}
        {service.technologies?.length > 3 && (
          <span className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-400">
            +{service.technologies.length - 3}
          </span>
        )}
      </div>

      {/* Price */}
      <p className="text-sm font-semibold text-indigo-400 mb-4">{service.price}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(service)}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          Edit
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all disabled:opacity-50"
        >
          {toggling ? '...' : service.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm transition-all disabled:opacity-50"
        >
          {deleting ? '...' : '🗑'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function ServiceManagerTab() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const fetchedRef = useRef(false);

  // ── Fetch services ──────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'all' });
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/services?${params}`);
      if (res.data.success) {
        setServices(res.data.data.services || []);
      }
    } catch (err) {
      console.error('Fetch services error:', err);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchQuery]);

  useEffect(() => {
  if (!fetchedRef.current) {
    fetchServices();
    fetchedRef.current = true;
  }
}, [fetchServices]);
  // ── Form validation ──────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.category) e.category = 'Category is required';
    return e;
  };

  // ── Handle field changes ──────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Handle gradient preset ───────────────────
  const handleGradientSelect = (preset) => {
    setFormData((prev) => ({ ...prev, gradient: preset.value, lightGradient: preset.light }));
  };

  // ── Open edit ────────────────────────────────
  const openEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      longDescription: service.longDescription || '',
      category: service.category || 'development',
      features: service.features || [],
      technologies: service.technologies || [],
      price: service.price || '',
      timeline: service.timeline || '',
      keywords: service.keywords || [],
      gradient: service.gradient || 'from-indigo-500 to-purple-600',
      lightGradient: service.lightGradient || 'from-indigo-500/10 to-purple-600/10',
      iconType: service.iconType || 'code',
      status: service.status || 'active',
    });
    setErrors({});
    setView('edit');
  };

  // ── Open create form ─────────────────────────
  const openCreate = () => {
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setView('create');
  };

  // ── Cancel ───────────────────────────────────
  const handleCancel = () => {
    setView('list');
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  // ── Submit (create or update) ────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill in required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingService) {
        // UPDATE
        const res = await api.put(`/services/${editingService._id}`, formData);
       if (res.data.success) {
  await fetchServices(); // 🔥 important
  showToast('Service updated successfully!', 'success');
  setView('list');
}
      } else {
        // CREATE
        const res = await api.post('/services', formData);

if (res.data.success) {
  await fetchServices(); // 🔥 MAIN FIX
  showToast('Service created successfully! 🎉', 'success');
  setFormData(EMPTY_FORM);
  setView('list');
}
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/services/${id}`);
      if (res.data.success) {
  await fetchServices();
  showToast('Service deleted', 'success');
}
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Toggle Status ────────────────────────────
  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/services/${id}/status`);
      if (res.data.success) {
  await fetchServices();
  showToast(res.data.message, 'success');
}
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  // ── Filtered list ─────────────────────────────
  const filteredServices = services.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    return true;
  });

  // ─────────────────────────────────────────────
  // RENDER: Form (create / edit)
  // ─────────────────────────────────────────────
  const renderForm = () => (
    <Reveal>
      <div className="max-w-4xl mx-auto">
        {/* Form Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              {editingService ? '✏️ Edit Service' : '🚀 Create New Service'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {editingService ? 'Update service details' : 'Add a new service to your portfolio'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
          >
            ← Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Section 1: Basic Info ── */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white">1</span>
              Basic Information
            </h3>
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Custom Web Development"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                    errors.title ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Short Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="One-liner that describes this service..."
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none ${
                    errors.description ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Long Description</label>
                <textarea
                  name="longDescription"
                  value={formData.longDescription}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Detailed description of the service, what's included, your process..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                />
              </div>

              {/* Category + Status */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⏸ Inactive</option>
                    <option value="draft">📝 Draft</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Pricing & Tags ── */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-xs text-white">2</span>
              Pricing & Details
            </h3>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium mb-2">Starting Price</label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. Starting from $5,000"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timeline</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  placeholder="e.g. 4-12 weeks"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-5">
              <TagInput
                label="Features"
                placeholder="Type a feature and press Enter..."
                tags={formData.features}
                onChange={(tags) => setFormData((prev) => ({ ...prev, features: tags }))}
              />
              <TagInput
                label="Technologies / Tools"
                placeholder="e.g. React, Node.js, AWS..."
                tags={formData.technologies}
                onChange={(tags) => setFormData((prev) => ({ ...prev, technologies: tags }))}
              />
              <TagInput
                label="Keywords (SEO)"
                placeholder="e.g. web design, ecommerce..."
                tags={formData.keywords}
                onChange={(tags) => setFormData((prev) => ({ ...prev, keywords: tags }))}
              />
            </div>
          </div>

          {/* ── Section 3: Appearance ── */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-orange-600 flex items-center justify-center text-xs text-white">3</span>
              Appearance
            </h3>

            {/* Icon picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Service Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, iconType: opt.id }))}
                    className={`
                      w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-lg
                      border transition-all duration-200
                      ${formData.iconType === opt.id
                        ? 'border-indigo-500 bg-indigo-500/20 scale-105'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }
                    `}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient picker */}
            <div>
              <label className="block text-sm font-medium mb-3">Color Gradient</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleGradientSelect(preset)}
                    className={`
                      relative h-10 rounded-xl bg-gradient-to-r ${preset.value}
                      border-2 transition-all duration-200
                      ${formData.gradient === preset.value
                        ? 'border-white scale-105 shadow-lg'
                        : 'border-transparent hover:scale-105'
                      }
                    `}
                    title={preset.label}
                  >
                    {formData.gradient === preset.value && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-3 text-gray-400">Live Preview</p>
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${formData.lightGradient} border border-white/10 max-w-sm`}>
                <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${formData.gradient} flex items-center justify-center text-white`}>
                  <div className="scale-75">{ICON_MAP[formData.iconType] || ICON_MAP.code}</div>
                </div>
                <h4 className="font-bold mb-1">{formData.title || 'Service Title'}</h4>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {formData.description || 'Short description will appear here...'}
                </p>
                {formData.price && (
                  <p className="mt-3 text-sm font-semibold text-indigo-400">{formData.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" loading={submitting}>
              {editingService ? '💾 Save Changes' : '🚀 Create Service'}
            </Button>
            <Button type="button" variant="glass" size="lg" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Reveal>
  );

  // ─────────────────────────────────────────────
  // RENDER: List view
  // ─────────────────────────────────────────────
  const renderList = () => (
    <Reveal>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">🧩 Service Manager</h2>
            <p className="text-gray-400 text-sm mt-1">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            + Add New Service
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none text-sm"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">✅ Active</option>
            <option value="inactive">⏸ Inactive</option>
            <option value="draft">📝 Draft</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchServices}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all disabled:opacity-50"
          >
            {loading ? '⟳ Loading...' : '↻ Refresh'}
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧩</div>
            <h3 className="text-xl font-bold mb-2">No services yet</h3>
            <p className="text-gray-400 mb-6">Create your first service to get started</p>
            <Button onClick={openCreate}>+ Create Service</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Stats bar */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
            {['active', 'inactive', 'draft'].map((s) => {
              const count = services.filter((sv) => sv.status === s).length;
              return (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    s === 'active' ? 'bg-green-400' : s === 'draft' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  <span className="capitalize text-gray-400">{s}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-sm ml-auto">
              <span className="text-gray-400">Total:</span>
              <span className="font-semibold gradient-text">{services.length}</span>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );

  // ─────────────────────────────────────────────
  // MAIN RETURN
  // ─────────────────────────────────────────────
  return (
    <div>
      {(view === 'create' || view === 'edit') ? renderForm() : renderList()}
    </div>
  );
}