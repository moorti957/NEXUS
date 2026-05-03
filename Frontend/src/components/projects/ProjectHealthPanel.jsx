// src/components/projects/ProjectHealthPanel.jsx
import { AlertTriangle, TrendingUp, Clock, DollarSign } from "lucide-react";

export default function ProjectHealthPanel({ project, formData }) {
  const progress = formData?.progress || 0;
  const deadlineRisk = new Date(formData?.deadline) < new Date() ? "High" : progress > 80 ? "Low" : "Medium";
  const budgetUsed = progress; // simplified example
  const riskLevel = progress < 30 ? "Low" : progress < 70 ? "Medium" : "High";

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/30">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Project Health</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span>Risk Level</span><span className={`font-bold ${riskLevel === "High" ? "text-red-400" : riskLevel === "Medium" ? "text-yellow-400" : "text-green-400"}`}>{riskLevel}</span></div>
        <div className="flex justify-between"><span>Budget Usage</span><span>{budgetUsed}%</span></div>
        <div className="flex justify-between"><span>Deadline Risk</span><span className={deadlineRisk === "High" ? "text-red-400" : "text-green-400"}>{deadlineRisk}</span></div>
        <div className="flex justify-between"><span>Est. Completion</span><span>{Math.ceil((100 - progress) / 10)} days</span></div>
        <div className="flex justify-between"><span>Productivity</span><span>{progress > 50 ? "Good" : "Needs attention"}</span></div>
      </div>
    </div>
  );
}