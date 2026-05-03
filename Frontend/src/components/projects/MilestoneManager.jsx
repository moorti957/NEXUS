// src/components/projects/MilestoneManager.jsx
import { useState, useEffect } from "react";
import { CheckCircle, Circle, PlusCircle } from "lucide-react";
import Button from "../common/Button";
import api from "../../services/api";
import { useToast } from "../common/Toast";

export default function MilestoneManager({ projectId, mode }) {
  const [milestones, setMilestones] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/milestones`);
      setMilestones(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addMilestone = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post(`/projects/${projectId}/milestones`, { title: newTitle, dueDate: newDate });
      showToast("Milestone added", "success");
      setNewTitle("");
      setNewDate("");
      fetchMilestones();
    } catch (err) {
      showToast("Failed to add", "error");
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      await api.put(`/projects/${projectId}/milestones/${id}`, { completed: !completed });
      fetchMilestones();
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">Milestones Management</h3>
      <div className="space-y-3">
        {milestones.map((m) => (
          <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              {mode === "edit" ? (
                <button onClick={() => toggleComplete(m._id, m.completed)}>
                  {m.completed ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-gray-400" />}
                </button>
              ) : (
                m.completed ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className={m.completed ? "line-through text-gray-400" : ""}>{m.title}</span>
            </div>
            <span className="text-xs text-gray-500">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "No date"}</span>
          </div>
        ))}
      </div>
      {mode === "edit" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input placeholder="Milestone title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
          <Button variant="glass" onClick={addMilestone}><PlusCircle className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}