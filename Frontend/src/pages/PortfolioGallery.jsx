import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '../data/projects';
import {
  FiArrowRight,
  FiAward,
  FiCode,
  FiPenTool,
  FiBarChart2,
  FiSmartphone,
  FiShoppingBag,
  FiGrid
} from 'react-icons/fi';

// Context & shared components
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import Reveal from '../components/common/Reveal';

// Assets (same as Home)
import projectImg from '../assets/image.png';
import banner1 from '../assets/banner.png';
import bnner3 from '../assets/bnner3.png';
import img from '../assets/8c0e69d3-bdc4-417f-b19f-8678a56c3f6e-cover.png';
import img1 from '../assets/img1.avif';
import img2 from '../assets/img2.png';
import img3 from '../assets/img3.jpg';
import jay from '../assets/jay2.png';
import saraswati from '../assets/saraswati.png';
// Category icons map
const categoryIconMap = {
  'Web Development': <FiCode className="w-4 h-4" />,
  'Mobile Apps': <FiSmartphone className="w-4 h-4" />,
  'UI/UX Design': <FiPenTool className="w-4 h-4" />,
  'Branding': <FiAward className="w-4 h-4" />,
  'SaaS': <FiBarChart2 className="w-4 h-4" />,
  'E-Commerce': <FiShoppingBag className="w-4 h-4" />
};

// ---------- Full Project Data (same as before, expanded) ----------
const allProjects = [
  {
    id: 1,
    slug: projects.ecommerce.slug,
    title: projects.ecommerce.title,
    image: projects.ecommerce.heroImage,
    description: projects.ecommerce.shortDesc,
    category: "Web Development",
    technologies: projects.ecommerce.techStack
  },
  {
    id: 2,
    slug: projects.fitness.slug,
    title: projects.fitness.title,
    image: projects.fitness.heroImage,
    description: projects.fitness.shortDesc,
    category: "Mobile Apps",
    technologies: projects.fitness.techStack
  },
  {
    id: 3,
    slug: projects.startup.slug,
    title: projects.startup.title,
    image: projects.startup.heroImage,
    description: projects.startup.shortDesc,
    category: "Branding",
    technologies: projects.startup.techStack
  },
   {
    id: 4,
    slug: projects.jaykisan.slug,
    title: projects.jaykisan.title,
    image: projects.jaykisan.heroImage,
    description: projects.jaykisan.shortDesc,
    category: "Web Development",
    technologies: projects.jaykisan.techStack
  },
  {
  id: 5,
  slug: projects.bhardwajmurti.slug,
  title: projects.bhardwajmurti.title,
  image: projects.bhardwajmurti.heroImage,
  description: projects.bhardwajmurti.shortDesc,
  category: "Branding",
  technologies: projects.bhardwajmurti.techStack
},
{
  id: 6,
  slug: projects.saraswatimurti.slug,
  title: projects.saraswatimurti.title,
  image: projects.saraswatimurti.heroImage,
  description: projects.saraswatimurti.shortDesc,
  category: "Branding",
  technologies: projects.saraswatimurti.techStack
}
];

// Helper: Placeholder for missing images
const PlaceholderArt = ({ category }) => {
  const gradients = {
    'Web Development': 'from-indigo-500/20 to-purple-600/20',
    'Mobile Apps': 'from-purple-500/20 to-pink-600/20',
    'UI/UX Design': 'from-pink-500/20 to-orange-600/20',
    'Branding': 'from-amber-500/20 to-rose-600/20',
    'SaaS': 'from-teal-500/20 to-emerald-600/20',
    'E-Commerce': 'from-sky-500/20 to-blue-600/20'
  };
  const gradient = gradients[category] || 'from-indigo-500/20 to-purple-600/20';

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${gradient} overflow-hidden`}>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99,102,241,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          {categoryIconMap[category] || <FiCode className="w-10 h-10 text-indigo-400/60" />}
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-400">
          <animate attributeName="r" values="80;90;80" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="100" r="40" fill="currentColor" className="text-purple-400/30">
          <animate attributeName="r" values="40;48;40" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

// ---------- Reusable Project Card (matches homepage style, image‑first) ----------
const ProjectCard = ({ project, index, variant = "medium" }) => {
  const hasImage = !!project.image;
  const aspectClass = variant === "large" ? "aspect-[16/9]" : variant === "vertical" ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group h-full"
    >
     <Link to={`/portfolio/${project.slug}`}
  className="block h-full"
>
<div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e1a] max-h-[450px]">          <div className={`relative w-full ${aspectClass} overflow-hidden bg-gray-900/50 flex-shrink-0`}>
            {hasImage ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <PlaceholderArt category={project.category} />
            )}

            {/* Dark gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Category badge */}
            <div className="absolute top-5 left-5 z-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 backdrop-blur-sm">
                {categoryIconMap[project.category]}
                <span>{project.category}</span>
              </span>
            </div>

            {/* Project number */}
            <div className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-sm text-white/50 font-display">{String(index + 1).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Content (reveals on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16">
            <h3 className="text-2xl font-bold font-display mb-2 text-white">{project.title}</h3>
            <p className="text-gray-300 mb-4 line-clamp-2">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {project.technologies.slice(0, 3).map(tech => (
                <span key={tech} className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-gray-200">
                  {tech}
                </span>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 text-base font-medium text-indigo-400">
              View Project
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </Link>
    </motion.div>
  );
};

// ---------- Filter Tabs ----------
const FilterTabs = ({ activeFilter, setActiveFilter, counts }) => {
  const filters = [
    { label: "All Projects", value: "All", count: counts.total },
    { label: "Web Development", value: "Web Development", icon: <FiCode className="w-3.5 h-3.5" />, count: counts.web },
    { label: "Mobile Apps", value: "Mobile Apps", icon: <FiSmartphone className="w-3.5 h-3.5" />, count: counts.mobile },
    { label: "UI/UX Design", value: "UI/UX Design", icon: <FiPenTool className="w-3.5 h-3.5" />, count: counts.uiux },
    { label: "Branding", value: "Branding", icon: <FiAward className="w-3.5 h-3.5" />, count: counts.branding },
    { label: "SaaS", value: "SaaS", icon: <FiBarChart2 className="w-3.5 h-3.5" />, count: counts.saas },
    { label: "E-Commerce", value: "E-Commerce", icon: <FiShoppingBag className="w-3.5 h-3.5" />, count: counts.ecommerce }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-16">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => setActiveFilter(filter.value)}
          className={`
            group relative px-6 py-2.5 rounded-full text-sm font-medium
            border transition-all duration-300 flex items-center gap-2
            ${activeFilter === filter.value
              ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
              : 'bg-white/3 border-white/10 text-gray-400 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-500/5'
            }
          `}
        >
          {filter.icon && <span className="opacity-70 group-hover:opacity-100">{filter.icon}</span>}
          <span>{filter.label}</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
};

// ---------- Helper: chunk projects into groups of 5 ----------
const chunkProjects = (projects, size = 5) => {
  const chunks = [];
  for (let i = 0; i < projects.length; i += size) {
    chunks.push(projects.slice(i, i + size));
  }
  return chunks;
};

// ---------- Main Component ----------
export default function PortfolioGallery() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredProjects, setFilteredProjects] = useState(allProjects);

  // Calculate counts for filters
  const counts = {
    total: allProjects.length,
    web: allProjects.filter(p => p.category === 'Web Development').length,
    mobile: allProjects.filter(p => p.category === 'Mobile Apps').length,
    uiux: allProjects.filter(p => p.category === 'UI/UX Design').length,
    branding: allProjects.filter(p => p.category === 'Branding').length,
    saas: allProjects.filter(p => p.category === 'SaaS').length,
    ecommerce: allProjects.filter(p => p.category === 'E-Commerce').length,
  };
  const industriesCount = Object.keys(counts).filter(k => k !== 'total' && counts[k] > 0).length;

  // Apply filter
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredProjects(allProjects);
    } else {
      setFilteredProjects(allProjects.filter(p => p.category === activeFilter));
    }
  }, [activeFilter]);

  const projectGroups = chunkProjects(filteredProjects, 5);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-white'} transition-colors duration-300`}>
      {/* Nexus Grid Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${isDark ? 'opacity-20' : 'opacity-5'}`}
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0v60M0 30h60" stroke="%236366f1" stroke-width="0.5" fill="none" /%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
      </div>

      {/* Hero Section with Floating Elements (matching Home) */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Floating animated elements */}
        <div className="absolute top-32 right-20 w-40 h-40 border border-indigo-500/30 rounded-full animate-float hidden lg:block" />
        <div className="absolute bottom-32 left-20 w-28 h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl animate-float animation-delay-2000 hidden lg:block" />
        <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-24 h-24 border-2 border-dashed border-purple-500/20 rounded-full animate-spin-slow" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              Nexus Creative Studio
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
              Portfolio <span className="gradient-text">Showcase</span>
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className={`text-lg max-w-2xl mb-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore all our projects, case studies and creative work crafted for clients worldwide.
            </p>
          </Reveal>

          <Reveal delay={450}>
            <div className="flex flex-wrap gap-12">
              <div>
                <div className="text-4xl font-bold font-display gradient-text">{counts.total}+</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Projects Delivered</div>
              </div>
              <div>
                <div className="text-4xl font-bold font-display gradient-text">{industriesCount}+</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Industries</div>
              </div>
              <div>
                <div className="text-4xl font-bold font-display gradient-text">100%</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Client Satisfaction</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery Section - Structured Groups */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-6">
          <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} counts={counts} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-20"
            >
              {projectGroups.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-6">
                    <FiGrid className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No projects found</h3>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Try adjusting your filter.</p>
                  <Button variant="glass" onClick={() => setActiveFilter('All')}>View All Projects</Button>
                </div>
              ) : (
                projectGroups.map((group, groupIdx) => {
                  const largeProject = group[0];
                  const verticalProject = group[1];
                  const mediumProjects = group.slice(2, 5);
                  const globalStartIndex = groupIdx * 5;

                  return (
                    <div key={groupIdx} className="space-y-8">
                      {/* Row 1: Large (70%) + Vertical (30%) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                          {largeProject && (
                            <ProjectCard
                              project={largeProject}
                              index={globalStartIndex}
                              variant="large"
                            />
                          )}
                        </div>
                        <div className="lg:col-span-4">
                          {verticalProject && (
                            <ProjectCard
                              project={verticalProject}
                              index={globalStartIndex + 1}
                              variant="vertical"
                            />
                          )}
                        </div>
                      </div>

                      {/* Row 2: Three Medium Cards */}
                      {mediumProjects.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {mediumProjects.map((project, idx) => (
                            <ProjectCard
                              key={project.id}
                              project={project}
                              index={globalStartIndex + 2 + idx}
                              variant="medium"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Bottom CTA Section (matches Home) */}
      <section className="py-24 relative overflow-hidden mt-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Ready to Start Your <span className="gradient-text">Project?</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className={`text-lg mb-10 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Let's collaborate and turn your vision into an extraordinary digital experience.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="xl" onClick={() => window.location.href = '/contact'}>Start Your Project</Button>
              <Button variant="glass" size="xl" onClick={() => window.location.href = '/services'}>Explore Services</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}