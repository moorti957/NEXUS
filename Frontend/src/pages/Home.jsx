import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import Reveal from '../components/common/Reveal';
import projectImg from '../assets/image.png';
import banner1 from '../assets/banner.png';
import bnner3 from '../assets/bnner3.png';
import img from '../assets/8c0e69d3-bdc4-417f-b19f-8678a56c3f6e-cover.png'
import img1 from '../assets/img1.avif'
import img2 from '../assets/img2.png'
import img3 from '../assets/img3.jpg'

export default function Home() {
  const { showToast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({
    projects: 150,
    clients: 50,
    awards: 12
  });
  
  const sliderInterval = useRef(null);

  // Hero Slider Images/Content
  const slides = [
    {
      id: 1,
      gradient: 'from-indigo-500/20 to-purple-600/20',
      pattern: 'circuit',
    },
    {
      id: 2,
      gradient: 'from-purple-500/20 to-pink-600/20',
      pattern: 'dots',
    },
    {
      id: 3,
      gradient: 'from-pink-500/20 to-orange-600/20',
      pattern: 'grid',
    },
  ];

  // Auto slide
  useEffect(() => {
    sliderInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(sliderInterval.current);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    clearInterval(sliderInterval.current);
    sliderInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
  };

  // Counter animation
  useEffect(() => {
    const animateValue = (start, end, duration, elementId) => {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;

    if (current >= end) {
      clearInterval(timer);
      current = end;
    }

    const el = document.getElementById(elementId);

    if (el) {
      el.textContent = Math.floor(current) + '+';
    }

  }, 16);
};

    // Start counters when stats section is in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateValue(0, 150, 2000, 'stat-projects');
          animateValue(0, 50, 2000, 'stat-clients');
          animateValue(0, 12, 2000, 'stat-awards');
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const statSection = document.getElementById('stats-section');
    if (statSection) observer.observe(statSection);

    return () => observer.disconnect();
  }, []);

  const images = [
  img,
  img1,
 img2,
  img3
];

  // Featured work data
  const featuredWork = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    category: 'Web Development',
    image: projectImg,
    gradient: 'from-indigo-500/10 to-purple-600/10',
    hoverGradient: 'from-indigo-500/20 to-purple-600/20',
    link: '/projects/ecommerce-platform',   // changed
  },
  {
    id: 2,
    title: 'Bastev Mobile App',
    category: 'Mobile App',
    image: banner1,
    gradient: 'from-purple-500/10 to-pink-600/10',
    hoverGradient: 'from-purple-500/20 to-pink-600/20',
    link: '/projects/fitness-tracker',      // changed
  },
  {
    id: 3,
    title: 'PdfBazaar.',
    category: 'Brand Identity',
    image: bnner3,
    gradient: 'from-pink-500/10 to-orange-600/10',
    hoverGradient: 'from-pink-500/20 to-orange-600/20',
    link: '/projects/startup-branding',     // changed
  },
];

  // Services data
  const services = [
    {
      id: 1,
      title: 'Web Development',
      description: 'Custom websites and web applications built with cutting-edge technologies.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-purple-600',
      hoverColor: 'hover:border-indigo-500/30',
    },
    {
      id: 2,
      title: 'UI/UX Design',
      description: 'Beautiful, intuitive interfaces that users love to interact with.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:border-purple-500/30',
    },
    {
      id: 3,
      title: 'Digital Marketing',
      description: 'Strategic campaigns that boost visibility and drive conversions.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-orange-600',
      hoverColor: 'hover:border-pink-500/30',
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'CEO, TechStart',
      content: '"Nexus transformed our digital presence completely. Their attention to detail and creative approach exceeded our expectations."',
      rating: 5,
      initial: 'S',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      id: 2,
      name: 'Michael Park',
      role: 'Founder, AppVenture',
      content: '"The team at Nexus delivered an incredible mobile app that our users absolutely love. Professional, innovative, and reliable."',
      rating: 5,
      initial: 'M',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Marketing Director, BrandCo',
      content: '"Outstanding work on our brand identity. Nexus captured our vision perfectly and delivered beyond what we imagined."',
      rating: 5,
      initial: 'E',
      gradient: 'from-pink-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Slider Background */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`
                absolute inset-0 transition-opacity duration-1000
                bg-gradient-to-br ${slide.gradient}
                ${index === currentSlide ? 'opacity-100' : 'opacity-0'}
              `}
            >
              {/* Pattern Overlay */}
              <div className={`
                absolute inset-0 opacity-20
                ${slide.pattern === 'circuit' ? 'bg-[url("/patterns/circuit.svg")]' : ''}
                ${slide.pattern === 'dots' ? 'bg-[url("/patterns/dots.svg")]' : ''}
                ${slide.pattern === 'grid' ? 'bg-[url("/patterns/grid.svg")]' : ''}
              `}></div>
            </div>
          ))}
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 right-20 w-32 h-32 border border-indigo-500/30 rounded-full animate-float hidden lg:block"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl animate-float animation-delay-2000 hidden lg:block"></div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                Award-Winning Digital Agency
              </div>

              <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
                We Create <br />
                <span className="gradient-text">Digital Magic</span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                Transform your vision into extraordinary digital experiences. We blend creativity with technology to build products that inspire and perform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  iconRight={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  }
                  onClick={() => navigateTo('services')}
                >
                  Explore Services
                </Button>

                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => navigateTo('about')}
                >
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div id="stats-section" className="flex gap-12 mt-16">
                <div>
                  <div className="text-4xl font-bold font-display gradient-text">
                    <span id="stat-projects">0+</span>
                  </div>
                  <div className="text-sm text-gray-500">Projects Delivered</div>
                </div>
                <div>
                  <div className="text-4xl font-bold font-display gradient-text">
                    <span id="stat-clients">0+</span>
                  </div>
                  <div className="text-sm text-gray-500">Happy Clients</div>
                </div>
                <div>
                  <div className="text-4xl font-bold font-display gradient-text">
                    <span id="stat-awards">0+</span>
                  </div>
                  <div className="text-sm text-gray-500">Awards Won</div>
                </div>
              </div>
            </Reveal>

            {/* Right Column - Visual Element */}
            <Reveal type="scale" className="relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Animated Rings */}
                <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-indigo-500/30 animate-spin-slow"></div>
                
                {/* Main Glass Card */}
                <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl border border-white/10 overflow-hidden glow-primary">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                  
                  {/* Animated Circles SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.8 }} />
                      </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="150" fill="none" stroke="url(#grad1)" strokeWidth="2" opacity="0.3">
                      <animate attributeName="r" values="150;160;150" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="200" r="100" fill="none" stroke="url(#grad1)" strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="100;110;100" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="200" r="50" fill="url(#grad1)" opacity="0.3">
                      <animate attributeName="r" values="50;60;50" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </svg>

                  {/* Center Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-float">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 animate-float animation-delay-1000">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Project Complete</div>
                      <div className="text-xs text-gray-400">Just now</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 animate-float animation-delay-3000">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium">+127% Growth</div>
                      <div className="text-xs text-gray-400">This month</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Slider Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${index === currentSlide 
                  ? 'bg-indigo-500 w-8' 
                  : 'bg-white/30 hover:bg-white/50'
                }
              `}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 hidden lg:flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs tracking-widest vertical-rl">SCROLL</span>
          <div className="w-px h-16 bg-gradient-to-b from-indigo-500 to-transparent"></div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                Our Portfolio
              </span>
            </Reveal>
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
                Featured <span className="gradient-text">Work</span>
              </h2>
            </Reveal>
            <Reveal delay={400}>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Explore our latest projects showcasing innovation, creativity, and technical excellence.
              </p>
            </Reveal>
          </div>

          {/* Featured Work Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredWork.map((work, index) => (
              <Reveal key={work.id} delay={index * 200} type="scale">
                <Link to={work.link} className="group block">
                  <div className={`
                    card-3d relative rounded-2xl overflow-hidden
                    bg-gradient-to-br ${work.gradient}
                    border border-white/10 aspect-[4/3]
                    transition-all duration-500
                    hover:shadow-2xl hover:shadow-indigo-500/20
                  `}>
                    {/* Hover Overlay */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${work.hoverGradient}
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500
                    `}></div>
                    
                    {/* Icon */}
                <div className="absolute inset-0 overflow-hidden">
  <img
    src={work.image}
    alt={work.title}
    className="w-full h-full object-cover object-center"
  />
</div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <span className="text-xs text-indigo-400 font-medium block mb-2">
                        {work.category}
                      </span>
                      <h3 className="text-xl font-bold">{work.title}</h3>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column */}
            <Reveal type="left">
              <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                What We Do
              </span>
              
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                Services That <span className="gradient-text">Drive Results</span>
              </h2>
              
              <p className="text-gray-400 mb-8">
                From concept to launch, we provide end-to-end digital solutions that help businesses thrive in the digital age. Our expertise spans across multiple domains.
              </p>

              {/* Services List */}
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`
                      flex items-start gap-4 p-4 rounded-xl
                      bg-white/5 border border-white/10
                      transition-all duration-300
                      ${service.hoverColor}
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl
                      bg-gradient-to-br ${service.gradient}
                      flex items-center justify-center flex-shrink-0
                    `}>
                      <div className="text-white">{service.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{service.title}</h3>
                      <p className="text-sm text-gray-400">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-8"
                onClick={() => navigateTo('services')}
              >
                View All Services
              </Button>
            </Reveal>

            {/* Right Column - Stats Card */}
            <Reveal type="right" className="relative">
  <div className="relative">
    <div className="rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-xl border border-white/10 p-8 glow-secondary">
      
      {/* Icon Grid */}
      <div className="grid grid-cols-2 gap-6">
        {images.map((img, index) => (
          <div
            key={index}
            className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center overflow-hidden"
          >
<div className="relative w-full h-full">
  <img
    src={img}
    alt="service"
    className="w-full h-full object-cover rounded-2xl"
  />
  <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Project Progress</span>
          <span className="text-sm font-medium">87%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[87%] bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
        </div>
      </div>
    </div>

    {/* Floating Rating Badge */}
    <div className="absolute -top-6 -right-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-medium text-sm shadow-2xl shadow-indigo-500/30 animate-float">
      ⭐ 5.0 Rating
    </div>
  </div>
</Reveal>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                Testimonials
              </span>
            </Reveal>
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
                What Clients <span className="gradient-text">Say</span>
              </h2>
            </Reveal>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={index * 200} type="scale">
                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 group">
                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-12 h-12 rounded-full
                      bg-gradient-to-br ${testimonial.gradient}
                      flex items-center justify-center text-lg font-bold
                    `}>
                      {testimonial.initial}
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
              Ready to Build Something <span className="gradient-text">Amazing?</span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Let's collaborate and bring your vision to life. Start your project today and join our growing list of successful partners.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="xl"
                onClick={() => navigateTo('contact')}
              >
                Start Your Project
              </Button>
              <Button
                variant="glass"
                size="xl"
                onClick={() => navigateTo('services')}
              >
                Learn More
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

// Helper navigation function (temporary - will be replaced with useNavigate)
function navigateTo(page) {
  window.location.href = `/${page}`;
}