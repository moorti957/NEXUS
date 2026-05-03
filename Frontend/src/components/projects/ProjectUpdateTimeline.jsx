// src/components/projects/ProjectUpdateTimeline.jsx
import { useState, useEffect } from "react";
import { Clock, PlusCircle } from "lucide-react";
import Button from "../common/Button";
import api from "../../services/api";
import { useToast } from "../common/Toast";

export default function ProjectUpdateTimeline({ projectId, mode }) {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchUpdates();
  }, [projectId]);

  const fetchUpdates = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/updates`);
      setUpdates(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const postUpdate = async () => {
    if (!newUpdate.trim()) return;
    try {
      await api.post(`/projects/${projectId}/updates`, { message: newUpdate });
      showToast("Update posted", "success");
      setNewUpdate("");
      fetchUpdates();
    } catch (err) {
      showToast("Failed to post", "error");
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Progress Update Timeline</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {updates.map((update, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-white/5 text-sm border-l-2 border-indigo-500">
            <p>{update.message}</p>
            <span className="text-xs text-gray-500">{new Date(update.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {updates.length === 0 && <p className="text-gray-500">No updates yet</p>}
      </div>
      {mode === "edit" && (
        <div className="mt-4 flex gap-2">
          <input
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Post new update (features, fixes, revisions...)"
            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
          />
          <Button variant="glass" onClick={postUpdate}><PlusCircle className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}