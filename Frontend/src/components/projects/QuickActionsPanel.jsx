// src/components/projects/QuickActionsPanel.jsx
import { TrendingUp, PlusCircle, Send, Upload, FileText, CheckCircle } from "lucide-react";
import Button from "../common/Button";
import { useToast } from "../common/Toast";
import api from "../../services/api";

export default function QuickActionsPanel({ projectId, mode }) {
  const { showToast } = useToast();

  const handleAction = async (action) => {
    showToast(`Action "${action}" triggered (integrate with API)`, "info");
    // Example API call:
    // await api.post(`/projects/${projectId}/actions`, { action });
  };

  if (mode !== "edit") return null;

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
      <div className="grid gap-3">
        <Button variant="glass" onClick={() => handleAction("Update Progress")}><TrendingUp className="w-4 h-4 mr-2" /> Update Progress</Button>
        <Button variant="glass" onClick={() => handleAction("Add Feature")}><PlusCircle className="w-4 h-4 mr-2" /> Add New Feature</Button>
        <Button variant="glass" onClick={() => handleAction("Push Client Update")}><Send className="w-4 h-4 mr-2" /> Push Client Update</Button>
        <Button variant="glass" onClick={() => handleAction("Upload Deliverable")}><Upload className="w-4 h-4 mr-2" /> Upload Deliverable</Button>
        <Button variant="glass" onClick={() => handleAction("Generate Invoice")}><FileText className="w-4 h-4 mr-2" /> Generate Invoice</Button>
        <Button variant="primary" onClick={() => handleAction("Send for Approval")}><CheckCircle className="w-4 h-4 mr-2" /> Send For Approval</Button>
      </div>
    </div>
  );
}