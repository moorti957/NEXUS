import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import profileimg from '../assets/12345.jpg'

export default function About() {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Alex Kim',
      role: 'CEO & Founder',
      bio: 'Visionary leader with 15+ years in digital innovation. Former tech lead at Google and startup founder.',
      initial: 'A',
      gradient: 'from-indigo-500 to-purple-600',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#',
      },
    },
    {
      id: 2,
      name: 'Jordan Lee',
      role: 'Creative Director',
      bio: 'Award‑winning designer with a passion for aesthetics. Work featured in Awwwards and Behance.',
      initial: 'J',
      gradient: 'from-purple-500 to-pink-600',
      social: {
        twitter: '#',
        linkedin: '#',
        dribbble: '#',
      },
    },
    {
      id: 3,
      name: 'Sam Chen',
      role: 'Lead Developer',
      bio: 'Full‑stack expert building scalable solutions. 10+ years experience in React, Node.js, and cloud architecture.',
      initial: 'S',
      gradient: 'from-pink-500 to-orange-600',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#',
      },
    },
    {
      id: 4,
      name: 'Maya Patel',
      role: 'Strategy Lead',
      bio: 'Data‑driven strategist maximizing ROI. MBA from Stanford with experience at McKinsey.',
      initial: 'M',
      gradient: 'from-orange-500 to-yellow-600',
      social: {
        twitter: '#',
        linkedin: '#',
        medium: '#',
      },
    },
  ];

  // Company values
  const values = [
    {
      id: 1,
      title: 'Innovation',
      description: 'We constantly push boundaries and explore new technologies to deliver cutting‑edge solutions.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-purple-600',
      hoverBorder: 'hover:border-indigo-500/30',
    },
    {
      id: 2,
      title: 'Collaboration',
      description: 'We believe the best results come from working closely with our clients as true partners.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-600',
      hoverBorder: 'hover:border-purple-500/30',
    },
    {
      id: 3,
      title: 'Excellence',
      description: 'We\'re committed to delivering nothing but the highest quality in everything we create.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-orange-600',
      hoverBorder: 'hover:border-pink-500/30',
    },
  ];

  // Timeline data
  const timeline = [
    {
      year: '2016',
      title: 'The Beginning',
      description: 'Nexus founded in San Francisco with a team of 3 passionate developers.',
    },
    {
      year: '2018',
      title: 'First Major Client',
      description: 'Secured partnership with TechStart, delivering their flagship e-commerce platform.',
    },
    {
      year: '2020',
      title: 'Award Winning',
      description: 'Won "Best Digital Agency" at the Web Excellence Awards.',
    },
    {
      year: '2022',
      title: 'Global Expansion',
      description: 'Opened offices in London and Singapore, team grew to 50+ experts.',
    },
    {
      year: '2024',
      title: 'Innovation Hub',
      description: 'Launched our R&D lab focusing on AI and immersive experiences.',
    },
  ];

  // Stats data with animation
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
        document.getElementById(elementId).textContent = Math.floor(current) + (elementId.includes('clients') ? '+' : '+');
      }, 16);
    };

    // Start counters when stats section is in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateValue(0, 8, 2000, 'stat-years');
          animateValue(0, 150, 2000, 'stat-projects');
          animateValue(0, 50, 2000, 'stat-clients');
          animateValue(0, 12, 2000, 'stat-awards');
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const statSection = document.getElementById('about-stats');
    if (statSection) observer.observe(statSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Reveal>
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
              About Us
            </span>
          </Reveal>
          
          <Reveal delay={200}>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
              We Are <span className="gradient-text">Nexus</span>
            </h1>
          </Reveal>
          
          <Reveal delay={400}>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              A team of passionate designers, developers, and strategists dedicated to creating 
              exceptional digital experiences that drive business growth.
            </p>
          </Reveal>
        </div>

        {/* Story & Mission Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          {/* Left Column - Image/Visual */}
          <Reveal type="left" className="order-2 lg:order-1">
  <div className="relative">
    <div className="aspect-square rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl border border-white/10 overflow-hidden glow-primary flex items-center justify-center">
      
      {/* ✅ Image instead of SVG */}
      <img
        src={profileimg}
        alt="about"
        className="w-full h-full object-cover"
      />

      {/* Floating elements */}
      <div className="absolute -top-6 -right-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/30 animate-float">
        <div className="text-2xl font-bold">8+</div>
        <div className="text-xs opacity-80">Years of passion</div>
      </div>

      <div className="absolute -bottom-6 -left-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-2xl shadow-purple-500/30 animate-float animation-delay-2000">
        <div className="text-2xl font-bold">150+</div>
        <div className="text-xs opacity-80">Projects delivered</div>
      </div>
    </div>
  </div>
</Reveal>
          {/* Right Column - Text */}
          <Reveal type="right" className="order-1 lg:order-2">
            <span className="text-indigo-400 font-medium mb-3 block">Our story</span>
            
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Crafted with <span className="gradient-text">purpose</span>
            </h2>
            
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              Founded in 2016, Nexus began with a simple mission: to bridge the gap between creativity 
              and technology. What started as a small team of three has grown into a full‑service digital 
              agency with experts across multiple disciplines.
            </p>
            
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              We believe that great design is not just about aesthetics – it's about solving problems, 
              creating connections, and delivering results. Every project we take on is an opportunity 
              to push boundaries and exceed expectations.
            </p>

            {/* Quick Stats Grid */}
            <div id="about-stats" className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-indigo-500/30 transition-all">
                <div className="text-3xl font-bold gradient-text">
                  <span id="stat-years">0+</span>
                </div>
                <div className="text-sm text-gray-400">Years of excellence</div>
              </div>
              
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
                <div className="text-3xl font-bold gradient-text">
                  <span id="stat-projects">0+</span>
                </div>
                <div className="text-sm text-gray-400">Projects completed</div>
              </div>
              
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-pink-500/30 transition-all">
                <div className="text-3xl font-bold gradient-text">
                  <span id="stat-clients">0+</span>
                </div>
                <div className="text-sm text-gray-400">Happy clients</div>
              </div>
              
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-orange-500/30 transition-all">
                <div className="text-3xl font-bold gradient-text">
                  <span id="stat-awards">0+</span>
                </div>
                <div className="text-sm text-gray-400">Awards won</div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Timeline Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400 mb-6">
                Our Journey
              </span>
            </Reveal>
            
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                The <span className="gradient-text">Roadmap</span>
              </h2>
            </Reveal>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>

            {/* Timeline Items */}
            {timeline.map((item, index) => (
              <Reveal 
                key={item.year} 
                type={index % 2 === 0 ? 'right' : 'left'}
                delay={index * 200}
              >
                <div className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}>
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 z-10"></div>
                  
                  {/* Content */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-indigo-500/30 transition-all">
                      <span className="text-3xl font-bold gradient-text mb-2 block">{item.year}</span>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Empty space for other side */}
                  <div className="w-1/2"></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-sm text-pink-400 mb-6">
                Our Team
              </span>
            </Reveal>
            
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                Meet the <span className="gradient-text">Experts</span>
              </h2>
            </Reveal>
            
            <Reveal delay={400}>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Creative minds with a passion for innovation and a track record of excellence.
              </p>
            </Reveal>
          </div>

          {/* Team Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Reveal key={member.id} delay={index * 200} type="scale">
                <div className="group">
                  <div className="card-3d p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 text-center backdrop-blur-sm hover:border-indigo-500/30 transition-all">
                    {/* Avatar */}
                    <div className={`
                      w-28 h-28 mx-auto mb-4 rounded-full
                      bg-gradient-to-br ${member.gradient}
                      flex items-center justify-center text-4xl font-bold
                      shadow-lg group-hover:scale-110 transition-transform duration-300
                    `}>
                      {member.initial}
                    </div>
                    
                    {/* Info */}
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className={`text-sm mb-3 bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent font-medium`}>
                      {member.role}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">{member.bio}</p>
                    
                    {/* Social Links */}
                    <div className="flex justify-center gap-3">
                      {Object.entries(member.social).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`
                            w-8 h-8 rounded-full bg-white/10
                            flex items-center justify-center text-sm
                            hover:bg-gradient-to-r ${member.gradient} hover:text-white
                            transition-all
                          `}
                        >
                          {platform === 'twitter' && '𝕏'}
                          {platform === 'linkedin' && '🔗'}
                          {platform === 'github' && '💻'}
                          {platform === 'dribbble' && '🎨'}
                          {platform === 'medium' && '✍️'}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-sm text-orange-400 mb-6">
                Core Values
              </span>
            </Reveal>
            
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                What Drives <span className="gradient-text">Us</span>
              </h2>
            </Reveal>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Reveal key={value.id} delay={index * 200} type="up">
                <div className={`
                  p-8 rounded-2xl bg-white/5 border border-white/10
                  transition-all duration-300 group
                  ${value.hoverBorder}
                `}>
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 mb-6 rounded-2xl
                    bg-gradient-to-br ${value.gradient}
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <div className="text-white">{value.icon}</div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-32">
          <div className="grid md:grid-cols-4 gap-8">
            <Reveal type="scale" delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/10 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">8+</div>
                <div className="text-gray-400">Years of Innovation</div>
              </div>
            </Reveal>
            
            <Reveal type="scale" delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-white/10 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">150+</div>
                <div className="text-gray-400">Projects Delivered</div>
              </div>
            </Reveal>
            
            <Reveal type="scale" delay={300}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-600/10 border border-white/10 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">50+</div>
                <div className="text-gray-400">Happy Clients</div>
              </div>
            </Reveal>
            
            <Reveal type="scale" delay={400}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border border-white/10 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">12</div>
                <div className="text-gray-400">Industry Awards</div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Client Logos / Partners */}
        <div className="text-center">
          <Reveal>
            <p className="text-gray-500 text-sm tracking-wider mb-8">
              TRUSTED BY INNOVATIVE COMPANIES
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-60">
              <span className="text-2xl font-display font-bold text-gray-400 hover:text-indigo-400 transition-colors cursor-default">
                TECHVANCE
              </span>
              <span className="text-2xl font-display font-bold text-gray-400 hover:text-purple-400 transition-colors cursor-default">
                FINCORP
              </span>
              <span className="text-2xl font-display font-bold text-gray-400 hover:text-pink-400 transition-colors cursor-default">
                DESIGNHUB
              </span>
              <span className="text-2xl font-display font-bold text-gray-400 hover:text-orange-400 transition-colors cursor-default">
                STARTUP
              </span>
              <span className="text-2xl font-display font-bold text-gray-400 hover:text-indigo-400 transition-colors cursor-default">
                INNOVATE
              </span>
            </div>
          </Reveal>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
              Want to join our <span className="gradient-text">team?</span>
            </h2>
          </Reveal>
          
          <Reveal delay={200}>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals who are passionate about creating exceptional digital experiences.
            </p>
          </Reveal>
          
          <Reveal delay={400}>
            <Link to="/contact">
              <Button size="lg">
                View Open Positions
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}