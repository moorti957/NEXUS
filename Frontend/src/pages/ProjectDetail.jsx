import { useParams, Navigate } from 'react-router-dom';
import { projects } from '../data/projects';
import ProjectHero from '../components/projects/ProjectHero';
import ProjectFeatures from '../components/projects/ProjectFeatures';
import ProjectGallery from '../components/projects/ProjectGallery';
import ProjectCTA from '../components/projects/ProjectCTA';
import Reveal from '../components/common/Reveal';

export default function ProjectDetail() {
  const { slug } = useParams();
  
  // Map slugs to project keys
  const slugToKey = {
    'ecommerce-platform': 'ecommerce',
    'fitness-tracker': 'fitness',
    'startup-branding': 'startup',
  };

  const projectKey = slugToKey[slug];
  const project = projects[projectKey];

  if (!project) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <ProjectHero
        title={project.title}
        description={project.shortDesc}
        image={project.heroImage}
        gradient={project.gradient}
         liveUrl={project.liveUrl} // 🔥 ये जरूरी है
      />

      {/* Overview Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-6 text-center">
              Project <span className="gradient-text">Overview</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-gray-400 text-lg leading-relaxed text-center">
              {project.overview}
            </p>
          </Reveal>
        </div>
      </section>

      <ProjectFeatures features={project.features} />

      {/* Tech Stack Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-12 text-center">
              Tech <span className="gradient-text">Stack</span>
            </h2>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            {project.techStack.map((tech, index) => (
              <Reveal key={index} delay={index * 50}>
                <span className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium">
                  {tech}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ProjectGallery images={project.screenshots} />
      <ProjectCTA />
    </div>
  );
}