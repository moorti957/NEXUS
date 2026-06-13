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
import {
  FiCode,
  FiPenTool,
  FiBarChart2,
  FiAward,
  FiBriefcase
} from "react-icons/fi";

import api from "../services/api";
const ICON_MAP = {
  code: <FiCode className="w-7 h-7" />,
  design: <FiPenTool className="w-7 h-7" />,
  chart: <FiBarChart2 className="w-7 h-7" />,
  branding: <FiAward className="w-7 h-7" />,
  consulting: <FiBriefcase className="w-7 h-7" />,
};

const getIcon = (iconType) => {
  return ICON_MAP[iconType] || <FiCode className="w-7 h-7" />;
};

export default function Home() {
  const { showToast } = useToast();
  const [services, setServices] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All Work');
  const [selectedService, setSelectedService] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [stats, setStats] = useState({
    projects: 150,
    clients: 50,
    awards: 12
  });
  

 const openContactModal = () => {
  setShowContactModal(true);
  setSelectedService(null);
};
const handleContactSubmit = (e) => {
  e.preventDefault();

  showToast?.("Message sent successfully!", "success");

  setShowContactModal(false);
};
  
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

  useEffect(() => {
  const fetchServices = async () => {
  try {
    const res = await api.get('/services/public?limit=3');

    console.log("PUBLIC SERVICES:", res.data);

    if (res.data.success) {
      setServices(res.data.data.services || []);
    }
  } catch (error) {
    console.error("Services Error:", error);
  }
};

  fetchServices();
}, []);





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
    link: '/portfolio/ecommerce-platform',   // changed
  },
  {
    id: 2,
    title: 'Bastev Mobile App',
    category: 'Mobile App',
    image: banner1,
    gradient: 'from-purple-500/10 to-pink-600/10',
    hoverGradient: 'from-purple-500/20 to-pink-600/20',
    link: '/portfolio/fitness-tracker',      // changed
  },
  {
    id: 3,
    title: 'PdfBazaar.',
    category: 'Brand Identity',
    image: bnner3,
    gradient: 'from-pink-500/10 to-orange-600/10',
    hoverGradient: 'from-pink-500/20 to-orange-600/20',
    link: '/portfolio/pdf-fasa',     // changed
  },
];

  // Services data
  // const services = [
  //   {
  //     id: 1,
  //     title: 'Web Development',
  //     description: 'Custom websites and web applications built with cutting-edge technologies.',
  //     icon: (
  //       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  //       </svg>
  //     ),
  //     gradient: 'from-indigo-500 to-purple-600',
  //     hoverColor: 'hover:border-indigo-500/30',
  //   },
  //   {
  //     id: 2,
  //     title: 'UI/UX Design',
  //     description: 'Beautiful, intuitive interfaces that users love to interact with.',
  //     icon: (
  //       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  //       </svg>
  //     ),
  //     gradient: 'from-purple-500 to-pink-600',
  //     hoverColor: 'hover:border-purple-500/30',
  //   },
  //   {
  //     id: 3,
  //     title: 'Digital Marketing',
  //     description: 'Strategic campaigns that boost visibility and drive conversions.',
  //     icon: (
  //       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  //       </svg>
  //     ),
  //     gradient: 'from-pink-500 to-orange-600',
  //     hoverColor: 'hover:border-pink-500/30',
  //   },
  // ];

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
      {/* ── Featured Work Section ───────────────────────── */}
<section className="py-32 relative overflow-hidden">

  {/* Ambient background glow */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
  </div>

  <div className="max-w-7xl mx-auto px-6">

    {/* ── Section Header ── */}
    <div className="text-center mb-16">
      <Reveal>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          Our Portfolio
        </div>
      </Reveal>
      <Reveal delay={200}>
        <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
          Work that{' '}
          <span className="gradient-text">speaks volumes</span>
        </h2>
      </Reveal>
      <Reveal delay={400}>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Meticulously crafted experiences across web, mobile, and brand —
          each project a statement of intent.
        </p>
      </Reveal>
    </div>

    {/* ── Filter Bar ── */}
    <Reveal delay={200}>
      <div className="flex flex-wrap justify-center gap-3 mb-14">
        {['All Work', 'Web Dev', 'Mobile', 'Branding', 'SaaS'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`
              px-5 py-2 rounded-full text-sm font-medium
              border transition-all duration-300
              ${activeFilter === f
                ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400'
                : 'bg-white/3 border-white/8 text-gray-400 hover:border-indigo-500/30 hover:text-indigo-300'}
            `}
          >
            {f}
          </button>
        ))}
      </div>
    </Reveal>

    {/* ── Asymmetric Grid ── */}
    <div className="space-y-4">

      {/* Row 1 — Hero card + tall card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">

        {/* Card 01 — Large hero */}
        <Reveal type="scale">
          <Link to={featuredWork[0]?.link || '#'} className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e1a] aspect-[16/9] lg:aspect-auto lg:h-[340px] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10">

              {/* Canvas-style animated BG */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-[#312e81]" />
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />

              {/* Project image */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={featuredWork[0]?.image || projectImg}
                  alt={featuredWork[0]?.title}
                  className="w-full h-full object-cover object-center opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              {/* Top meta row */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 backdrop-blur-sm">
                  Web Dev
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs backdrop-blur-sm">
                  <FiAward className="w-3 h-3" />
                  Awwwards nominee
                </div>
              </div>

              {/* Slide-up reveal on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs text-indigo-400 tracking-widest uppercase font-medium block mb-2">
                  {featuredWork[0]?.category}
                </span>
                <h3 className="text-2xl font-bold font-display mb-3">
                  {featuredWork[0]?.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['React', 'Node.js', 'PostgreSQL'].map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/8 border border-white/10 text-gray-300">{t}</span>
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-indigo-400 font-medium">
                  View case study
                  <span className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/35 transition-colors">
                    <FiCode className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card number */}
              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white/30 font-display">01</span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* Card 02 — Tall card */}
        <Reveal type="scale" delay={150}>
          <Link to={featuredWork[1]?.link || '#'} className="group block h-full">
            <div className="relative rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e1a] aspect-[4/3] lg:aspect-auto lg:h-[340px] transition-all duration-500 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10">

              <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#2e1065] to-[#4a1d96]" />
              {/* Mesh pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice">
                {Array.from({length:7}, (_,r) => Array.from({length:9}, (_,c) => (
                  <line key={`h${r}${c}`} x1={c*50} y1={r*57} x2={(c+1)*50} y2={r*57} stroke="#a855f7" strokeWidth="0.5"/>
                )))}
                {Array.from({length:9}, (_,c) => (
                  <line key={`v${c}`} x1={c*50} y1="0" x2={c*50} y2="340" stroke="#a855f7" strokeWidth="0.5"/>
                ))}
                {[[100,85],[250,170],[350,60],[150,255],[300,230]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#c084fc" opacity="0.6"/>
                ))}
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all duration-700" />

              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={featuredWork[1]?.image || banner1}
                  alt={featuredWork[1]?.title}
                  className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              <div className="absolute top-5 left-5">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 border border-purple-500/35 text-purple-300 backdrop-blur-sm">
                  Mobile App
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs text-purple-400 tracking-widest uppercase font-medium block mb-2">
                  {featuredWork[1]?.category}
                </span>
                <h3 className="text-xl font-bold font-display mb-3">{featuredWork[1]?.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['React Native', 'Swift'].map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/8 border border-white/10 text-gray-300">{t}</span>
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-purple-400 font-medium">
                  View case study
                  <span className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <FiPenTool className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white/30 font-display">02</span>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>

      {/* Row 2 — Three equal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card 03 */}
        <Reveal type="scale" delay={100}>
          <Link to={featuredWork[2]?.link || '#'} className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e1a] aspect-[4/3] transition-all duration-500 hover:-translate-y-1 hover:border-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/10">

              <div className="absolute inset-0 bg-gradient-to-br from-pink-950 via-[#500724] to-[#831843]" />
              {/* Rings pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice">
                {[80,110,140,170].map((r,i) => (
                  <circle key={i} cx="150" cy="112" r={r} fill="none" stroke="#ec4899" strokeWidth="0.7"/>
                ))}
                <circle cx="150" cy="112" r="18" fill="#ec4899" opacity="0.4"/>
              </svg>

              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={featuredWork[2]?.image || bnner3}
                  alt={featuredWork[2]?.title}
                  className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-500/20 border border-pink-500/35 text-pink-300 backdrop-blur-sm">
                  Branding
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs text-pink-400 tracking-widest uppercase font-medium block mb-1.5">
                  Brand Identity
                </span>
                <h3 className="text-lg font-bold font-display mb-3">{featuredWork[2]?.title}</h3>
                <div className="inline-flex items-center gap-2 text-sm text-pink-400 font-medium">
                  View case study
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                    <FiAward className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white/30 font-display">03</span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* Card 04 — Teal/SaaS */}
        <Reveal type="scale" delay={200}>
          <div className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e1a] aspect-[4/3] transition-all duration-500 hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/10">

              <div className="absolute inset-0 bg-gradient-to-br from-teal-950 via-[#042f2e] to-[#065f46]" />
              {/* Dot field */}
              <div className="absolute inset-0 opacity-25"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-teal-400/10 blur-2xl group-hover:bg-teal-400/20 transition-all duration-700" />

              {/* Fake dashboard UI inside card */}
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-70 transition-opacity duration-500">
                <div className="w-4/5 h-3/5 rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-2 w-1/3 rounded bg-teal-500/40" />
                    <div className="h-2 w-1/4 rounded bg-teal-500/20" />
                  </div>
                  <div className="flex gap-1 items-end h-10 mt-2">
                    {[40,65,45,80,55,90,70].map((v,i) => (
                      <div key={i} className="flex-1 rounded-sm bg-teal-500/40" style={{height:`${v}%`}} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-1.5 w-1/2 rounded bg-white/10" />
                    <div className="h-1.5 w-1/4 rounded bg-white/10" />
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-teal-500/20 border border-teal-500/35 text-teal-300 backdrop-blur-sm">
                  SaaS
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs text-teal-400 tracking-widest uppercase font-medium block mb-1.5">
                  Analytics Platform
                </span>
                <h3 className="text-lg font-bold font-display mb-3">Lumina Analytics</h3>
                <div className="inline-flex items-center gap-2 text-sm text-teal-400 font-medium">
                  View case study
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                    <FiBarChart2 className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white/30 font-display">04</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Card 05 — Amber/Design */}
        <Reveal type="scale" delay={300}>
          <div className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e1a] aspect-[4/3] transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10">

              <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-[#1c1917] to-[#44403c]" />
              {/* Typography art */}
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                <span className="text-[110px] font-black font-display text-amber-500/10 leading-none group-hover:text-amber-500/18 transition-colors duration-500">
                  UI
                </span>
              </div>
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(245,158,11,0.35) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/35 text-amber-300 backdrop-blur-sm">
                  UI Design
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs text-amber-400 tracking-widest uppercase font-medium block mb-1.5">
                  Design System
                </span>
                <h3 className="text-lg font-bold font-display mb-3">Aura Design System</h3>
                <div className="inline-flex items-center gap-2 text-sm text-amber-400 font-medium">
                  View case study
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <FiPenTool className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white/30 font-display">05</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>

    {/* ── Footer CTA ── */}
    <div className="text-center mt-16">
      <Reveal delay={200}>
        <Link to="/portfolioGallery">
          <Button
            size="lg"
            variant="glass"
            iconRight={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            }
          >
            View all 24 projects
          </Button>
        </Link>
      </Reveal>
    </div>

  </div>
</section>

      {/* Services Preview Section */}
      <section className="py-24 relative">
  <div className="max-w-7xl mx-auto px-6">

    <div className="text-center mb-16">
      <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
        Our Services
      </span>

      <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
        Services We <span className="gradient-text">Provide</span>
      </h2>

      <p className="text-gray-400 max-w-2xl mx-auto">
        Professional digital services tailored to your business needs.
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.slice(0, 3).map((service, index) => (
        <Reveal
          key={service._id}
          delay={index * 100}
          type="scale"
        >
          <div
  className="group relative h-full cursor-pointer"
  onClick={() => setSelectedService(service)}
>
            <div
              className={`
                h-full p-6 rounded-2xl
                bg-gradient-to-br ${service.lightGradient || "from-indigo-500/10 to-purple-600/10"}
                border border-white/10
                backdrop-blur-sm
                hover:border-indigo-500/30
                transition-all duration-500
                hover:shadow-xl hover:shadow-indigo-500/20
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-14 h-14 mb-5 rounded-xl
                  bg-gradient-to-br ${service.gradient || "from-indigo-500 to-purple-600"}
                  flex items-center justify-center
                  group-hover:scale-110
                  transition-transform duration-300
                `}
              >
                <div className="text-white">
  {getIcon(service.iconType)}
</div>
              </div>

              <h3 className="text-xl font-bold mb-2">
                {service.title}
              </h3>

              <p className="text-gray-400 text-sm mb-5 line-clamp-2">
                {service.description}
              </p>

              <div className="space-y-2 mb-5">
                {(service.features || [])
                  .slice(0, 3)
                  .map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {feature}
                    </div>
                  ))}
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3 text-sm">
                <span className="text-indigo-400 font-medium">
                  {service.price}
                </span>

                <span className="text-gray-500">
                  {service.timeline}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>

    <div className="text-center mt-12">
      <Link to="/services">
        <Button size="lg">
          View All Services
        </Button>
      </Link>
    </div>

  </div>
</section>



 {selectedService && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
              onClick={() => setSelectedService(null)}
            />

            {/* Modal Content */}
            <Reveal
              type="scale"
              className="relative z-[9999] mt-24 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#13131a] border border-white/10 shadow-2xl">
                {/* Header */}
                <div
                  className={`p-8 rounded-t-3xl bg-gradient-to-r ${
                    selectedService.gradient || 'from-indigo-500 to-purple-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-white">{getIcon(selectedService.iconType)}</div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedService.title}</h2>
                        <p className="text-white/80 capitalize">{selectedService.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8">
                  {/* Overview */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3">Overview</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {selectedService.longDescription || selectedService.description}
                    </p>
                  </div>

                  {/* Features + Technologies */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Features */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Key Features</h3>
                      <ul className="space-y-3">
                        {(selectedService.features || []).map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 text-gray-300">
                            <span
                              className={`
                                w-5 h-5 rounded-full flex-shrink-0
                                bg-gradient-to-r ${selectedService.gradient || 'from-indigo-500 to-purple-600'}
                                flex items-center justify-center text-xs text-white
                              `}
                            >
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technologies + Pricing */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Technologies</h3>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {(selectedService.technologies || []).map((tech, index) => (
                          <span
                            key={index}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm
                              bg-gradient-to-r ${selectedService.lightGradient || 'from-indigo-500/10 to-purple-600/10'}
                              border border-white/10
                            `}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Pricing Info */}
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h4 className="font-medium mb-4">Pricing & Timeline</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Starting Price:</span>
                            <span className="font-bold gradient-text">{selectedService.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Typical Timeline:</span>
                            <span className="font-bold">{selectedService.timeline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-white/10">
                    <Button size="lg" onClick={openContactModal}>
                      Get Started
                    </Button>
                    <Link to="/contact">
                      <Button variant="glass" size="lg">
                        Contact Sales
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* ── Contact Modal ── */}
        {showContactModal && (
          <div className="fixed inset-0 z-[10000] mt-20 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[10000]"
              onClick={() => setShowContactModal(false)}
            />
            <div className="relative z-[10001] max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#13131a] border border-white/10 shadow-2xl">
              <div className="sticky top-0 flex justify-between items-center p-6 border-b border-white/10 bg-[#13131a]/95 backdrop-blur-sm rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  Get Started with {selectedService?.title || 'Our Services'}
                </h2>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="p-6 space-y-6">
                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                        errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                        errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Service & Budget */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    >
                      <option value="">Select a service</option>
                      {serviceOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget Range</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    >
                      <option value="">Select budget</option>
                      {budgetOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none ${
                      errors.message ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'
                    }`}
                    placeholder="Tell us about your project..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>

                {/* Newsletter */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="newsletter"
                    id="newsletter-modal"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-white/5 border border-white/10 checked:bg-indigo-500"
                  />
                  <label htmlFor="newsletter-modal" className="text-sm text-gray-400">
                    Subscribe to our newsletter for updates and insights
                  </label>
                </div>

                <Button type="submit" size="lg" fullWidth loading={contactLoading}>
                  Send Message
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  * Required fields. We'll get back to you within 24 hours.
                </p>
              </form>
            </div>
          </div>
        )}  

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