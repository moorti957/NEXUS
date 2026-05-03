// src/components/projects/MilestoneTimeline.jsx
export default function MilestoneTimeline({ milestones, onToggle }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Milestones</h3>
      <div className="space-y-4">
        {milestones.map((milestone, idx) => (
          <div key={milestone._id} className="relative pl-8">
            {idx !== milestones.length - 1 && (
              <div className="absolute left-3 top-6 w-0.5 h-full bg-white/10" />
            )}
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggle(milestone._id)}
                className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                  milestone.completed ? 'bg-indigo-500 border-indigo-500' : 'border-white/30'
                }`}
              />
              <div>
                <h4 className={`font-medium ${milestone.completed ? 'line-through text-gray-400' : ''}`}>
                  {milestone.title}
                </h4>
                <p className="text-sm text-gray-500">{milestone.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}