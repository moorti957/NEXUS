// src/components/blog/RoleBadge.jsx

export default function RoleBadge({ role }) {
  if (!role) return null;

  const isFreelancer = role === 'freelancer';

  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
        ${isFreelancer
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }
      `}
    >
      {role}
    </span>
  );
}