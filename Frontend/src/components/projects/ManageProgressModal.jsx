// src/components/projects/ManageProgressModal.jsx
import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import api from '../../services/api';
import MilestoneTimeline from './MilestoneTimeline';

export default function ManageProgressModal({ project, onClose, onProgressUpdate }) {
  const { showToast } = useToast();
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [milestonesRes, tasksRes] = await Promise.all([
          api.get(`/projects/${project._id}/milestones`),
          api.get(`/projects/${project._id}/tasks`)
        ]);
        setMilestones(milestonesRes.data.data || []);
        setTasks(tasksRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [project._id]);

  const toggleMilestone = async (milestoneId) => {
    const updated = milestones.map(m => 
      m._id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    setMilestones(updated);
    await recalcProgress(updated, tasks);
  };

  const toggleTask = async (taskId) => {
    const updated = tasks.map(t =>
      t._id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    await recalcProgress(milestones, updated);
  };

  const recalcProgress = async (newMilestones, newTasks) => {
    const totalMilestones = newMilestones.length;
    const completedMilestones = newMilestones.filter(m => m.completed).length;
    const totalTasks = newTasks.length;
    const completedTasks = newTasks.filter(t => t.completed).length;

    let progress = 0;
    if (totalMilestones > 0) progress = (completedMilestones / totalMilestones) * 100;
    if (totalTasks > 0) progress = (completedTasks / totalTasks) * 100;

    setSaving(true);
    try {
      await api.put(`/projects/${project._id}/progress`, { progress: Math.round(progress) });
      onProgressUpdate?.(Math.round(progress));
      showToast(`Progress updated to ${Math.round(progress)}%`, 'success');
    } catch (err) {
      showToast('Failed to save progress', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-[#1a1a22] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Progress – {project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading tasks & milestones...</div>
        ) : (
          <>
            <MilestoneTimeline milestones={milestones} onToggle={toggleMilestone} />
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Tasks</h3>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task._id)}
                      className="w-5 h-5 rounded border-white/20 text-indigo-500"
                    />
                    <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="glass" onClick={onClose}>Close</Button>
              {saving && <span className="text-sm text-indigo-400">Saving...</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}