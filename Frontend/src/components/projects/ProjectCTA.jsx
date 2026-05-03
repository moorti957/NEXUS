import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import Button from '../common/Button';

export default function ProjectCTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <Reveal>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Want a similar <span className="gradient-text">website?</span>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-gray-400 text-lg mb-8">
            Let's build something amazing together. Get in touch to discuss your project.
          </p>
        </Reveal>
        <Reveal delay={400}>
          <Link to="/contact">
            <Button size="xl">Contact Us</Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}