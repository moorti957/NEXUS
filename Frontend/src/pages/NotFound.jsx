import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Reveal from '../components/common/Reveal';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <Reveal>
          <span className="text-8xl font-bold gradient-text mb-6 block">404</span>
        </Reveal>
        
        <Reveal delay={200}>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Page Not Found
          </h1>
        </Reveal>
        
        <Reveal delay={400}>
          <p className="text-gray-400 text-lg mb-10">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </Reveal>
        
        <Reveal delay={600}>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/">
              <Button size="lg">
                Go Back Home
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="glass" size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}