import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Services() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Contact form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    phone: '',
    service: '',
    budget: '',
    message: '',
    newsletter: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Services data (full original array)
  const services = [
    {
      id: 1,
      category: 'development',
      title: 'Web Development',
      description: 'Custom websites and web applications built with cutting-edge technologies.',
      longDescription: 'We build responsive, performant, and scalable web applications using modern frameworks like React, Vue, and Next.js. Our team ensures your website not only looks great but also delivers exceptional user experience and performance.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-purple-600',
      lightGradient: 'from-indigo-500/10 to-purple-600/10',
      features: [
        'Custom Web Applications',
        'E-commerce Solutions',
        'Progressive Web Apps (PWA)',
        'API Development & Integration',
        'Performance Optimization',
        'SEO-friendly Architecture',
      ],
      technologies: ['React', 'Node.js', 'Python', 'GraphQL', 'AWS', 'Docker'],
      price: 'Starting from $5,000',
      timeline: '4-12 weeks',
    },
    {
      id: 2,
      category: 'design',
      title: 'UI/UX Design',
      description: 'Beautiful, intuitive interfaces that users love to interact with.',
      longDescription: 'Our design process combines aesthetics with functionality. We create user-centered designs that not only look stunning but also provide seamless user experiences across all devices and platforms.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-600',
      lightGradient: 'from-purple-500/10 to-pink-600/10',
      features: [
        'User Interface Design',
        'User Experience Strategy',
        'Wireframing & Prototyping',
        'Design Systems',
        'Mobile App Design',
        'User Testing & Research',
      ],
      technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Framer', 'Principle'],
      price: 'Starting from $3,500',
      timeline: '3-8 weeks',
    },
    {
      id: 3,
      category: 'marketing',
      title: 'Digital Marketing',
      description: 'Strategic campaigns that boost visibility and drive conversions.',
      longDescription: 'We create data-driven marketing strategies that help you reach your target audience, increase brand awareness, and drive meaningful engagement and conversions.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-orange-600',
      lightGradient: 'from-pink-500/10 to-orange-600/10',
      features: [
        'SEO Optimization',
        'Social Media Marketing',
        'Content Strategy',
        'Email Marketing',
        'PPC Campaigns',
        'Analytics & Reporting',
      ],
      technologies: ['Google Analytics', 'SEMrush', 'HubSpot', 'Mailchimp', 'Hootsuite'],
      price: 'Starting from $2,500/month',
      timeline: 'Ongoing',
    },
    {
      id: 4,
      category: 'branding',
      title: 'Brand Identity',
      description: 'Create a memorable brand that stands out from the competition.',
      longDescription: 'We help you define and communicate your brand identity through strategic positioning, visual design, and compelling storytelling that resonates with your audience.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-yellow-600',
      lightGradient: 'from-orange-500/10 to-yellow-600/10',
      features: [
        'Brand Strategy',
        'Visual Identity Design',
        'Brand Guidelines',
        'Logo Design',
        'Brand Messaging',
        'Market Positioning',
      ],
      technologies: ['Illustrator', 'Photoshop', 'After Effects', 'Premiere Pro'],
      price: 'Starting from $4,000',
      timeline: '4-6 weeks',
    },
    {
      id: 5,
      category: 'development',
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications for iOS and Android.',
      longDescription: 'We develop high-performance mobile apps that provide exceptional user experiences. Whether you need native iOS/Android or cross-platform solutions, we deliver robust and scalable applications.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-green-500 to-teal-600',
      lightGradient: 'from-green-500/10 to-teal-600/10',
      features: [
        'iOS App Development',
        'Android App Development',
        'Cross-platform (React Native)',
        'App Store Optimization',
        'Push Notifications',
        'In-app Purchases',
      ],
      technologies: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Firebase'],
      price: 'Starting from $8,000',
      timeline: '6-16 weeks',
    },
    {
      id: 6,
      category: 'consulting',
      title: 'Tech Consulting',
      description: 'Expert guidance to help you make the right technology decisions.',
      longDescription: 'Our experienced consultants provide strategic advice on technology architecture, digital transformation, and process optimization to help your business grow and innovate.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-600',
      lightGradient: 'from-blue-500/10 to-indigo-600/10',
      features: [
        'Technology Strategy',
        'Digital Transformation',
        'Architecture Review',
        'Performance Audit',
        'Team Training',
        'Code Reviews',
      ],
      technologies: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform', 'Jenkins'],
      price: 'Starting from $250/hour',
      timeline: 'Flexible',
    },
  ];

  // Filter categories
  const categories = [
    { id: 'all', label: 'All Services', icon: '🔍' },
    { id: 'development', label: 'Development', icon: '💻' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'marketing', label: 'Marketing', icon: '📈' },
    { id: 'branding', label: 'Branding', icon: '✨' },
    { id: 'consulting', label: 'Consulting', icon: '💡' },
  ];

  // Filter services based on active tab
  const filteredServices =
    activeTab === 'all'
      ? services
      : services.filter((service) => service.category === activeTab);

  // Contact form validation
  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
    if (!formData.message.trim()) e.message = 'Message is required';
    return e;
  };

  // Handle contact form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Submit contact form
  const handleContactSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/contact', formData);
      if (response.data.success) {
        showToast(response.data.message || "Message sent! We'll be in touch soon.", 'success');
        // Reset form
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          company: '',
          phone: '',
          service: '',
          budget: '',
          message: '',
          newsletter: false,
        });
        setShowContactModal(false); // close modal on success
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open contact modal and prefill data
  const openContactModal = () => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      service: selectedService?.title || '',
    }));
    setShowContactModal(true);
  };

  // Options for select fields
  const serviceOptions = [
    'Web Development',
    'UI/UX Design',
    'Digital Marketing',
    'Brand Identity',
    'Mobile App Development',
    'Tech Consulting',
  ];
  const budgetOptions = [
    'Less than $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    '$100,000+',
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Reveal>
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
              Our Services
            </span>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
              What We <span className="gradient-text">Offer</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Comprehensive digital solutions tailored to your unique needs.
              From concept to launch, we've got you covered.
            </p>
          </Reveal>
        </div>

        {/* Category Tabs */}
        <Reveal delay={600} className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`
                  px-6 py-3 rounded-full text-sm font-medium
                  transition-all duration-300 flex items-center gap-2
                  ${
                    activeTab === category.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }
                `}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredServices.map((service, index) => (
            <Reveal key={service.id} delay={index * 100} type="scale">
              <div
                className="group relative h-full cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <div
                  className={`
                  h-full p-8 rounded-2xl
                  bg-gradient-to-br ${service.lightGradient}
                  border border-white/10 backdrop-blur-sm
                  hover:border-indigo-500/30 transition-all duration-500
                  hover:shadow-2xl hover:shadow-indigo-500/20
                  card-3d
                `}
                >
                  {/* Icon */}
                  <div
                    className={`
                    w-16 h-16 mb-6 rounded-2xl
                    bg-gradient-to-br ${service.gradient}
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-300
                  `}
                  >
                    <div className="text-white">{service.icon}</div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-400 mb-6">{service.description}</p>

                  {/* Features Preview */}
                  <div className="space-y-2 mb-6">
                    {service.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Price & Timeline */}
                  <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4 mt-4">
                    <span className="text-indigo-400 font-medium">{service.price}</span>
                    <span className="text-gray-500">{service.timeline}</span>
                  </div>

                  {/* Learn More Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 to-purple-600/90 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <span className="text-white font-medium flex items-center gap-2">
                      Learn More
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Service Detail Modal */}
        {selectedService && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
              onClick={() => setSelectedService(null)}
            ></div>

            {/* Modal Content */}
            <Reveal type="scale" className="relative z-[9999] mt-24 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div
                className={`
                rounded-3xl
                bg-gradient-to-br from-[#1a1a24] to-[#13131a]
                border border-white/10 shadow-2xl
              `}
              >
                {/* Header */}
                <div
                  className={`
                  p-8 rounded-t-3xl
                  bg-gradient-to-r ${selectedService.gradient}
                `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-white">{selectedService.icon}</div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedService.title}</h2>
                        <p className="text-white/80">{selectedService.category}</p>
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
                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3">Overview</h3>
                    <p className="text-gray-400 leading-relaxed">{selectedService.longDescription}</p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4">Key Features</h3>
                      <ul className="space-y-3">
                        {selectedService.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 text-gray-300">
                            <span
                              className={`
                              w-5 h-5 rounded-full
                              bg-gradient-to-r ${selectedService.gradient}
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

                    <div>
                      <h3 className="text-xl font-bold mb-4">Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedService.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm
                              bg-gradient-to-r ${selectedService.lightGradient}
                              border border-white/10
                            `}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Pricing Info */}
                      <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
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

        {/* Nested Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-[10000] mt-20 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[10000]"
              onClick={() => setShowContactModal(false)}
            ></div>
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
                        errors.name
                          ? 'border-red-500/50'
                          : 'border-white/10 focus:border-indigo-500'
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
                        errors.email
                          ? 'border-red-500/50'
                          : 'border-white/10 focus:border-indigo-500'
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
                        <option key={s} value={s}>
                          {s}
                        </option>
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
                        <option key={b} value={b}>
                          {b}
                        </option>
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
                      errors.message
                        ? 'border-red-500/50'
                        : 'border-white/10 focus:border-indigo-500'
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

                <Button type="submit" size="lg" fullWidth loading={loading}>
                  Send Message
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  * Required fields. We'll get back to you within 24 hours.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Process Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400 mb-6">
                Our Process
              </span>
            </Reveal>

            <Reveal delay={200}>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                How We <span className="gradient-text">Work</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery',
                description: 'We learn about your business, goals, and target audience.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Strategy',
                description: 'We develop a comprehensive plan tailored to your needs.',
                icon: '📋',
              },
              {
                step: '03',
                title: 'Execution',
                description: 'Our team brings the vision to life with precision.',
                icon: '⚡',
              },
              {
                step: '04',
                title: 'Launch & Support',
                description: 'We deploy and provide ongoing maintenance and support.',
                icon: '🚀',
              },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 200} type="up">
                <div className="text-center group">
                  <div
                    className={`
                    w-20 h-20 mx-auto mb-6 rounded-2xl
                    bg-gradient-to-br from-indigo-500/10 to-purple-600/10
                    border border-white/10
                    flex items-center justify-center
                    group-hover:scale-110 group-hover:from-indigo-500/20 group-hover:to-purple-600/20
                    transition-all duration-300
                  `}
                  >
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <span className="text-sm text-indigo-400 font-mono mb-2 block">{item.step}</span>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Reveal>
              <span className="inline-block px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-sm text-pink-400 mb-6">
                FAQ
              </span>
            </Reveal>

            <Reveal delay={200}>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </Reveal>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              {
                q: 'How do you price your services?',
                a: 'We offer flexible pricing models including fixed-price projects, hourly rates, and monthly retainers. Each project is unique, so we provide custom quotes based on your specific requirements.',
              },
              {
                q: 'What is your typical project timeline?',
                a: 'Timelines vary depending on the scope and complexity. A simple website might take 4-6 weeks, while a complex web application could take 3-6 months. Well provide a detailed timeline during the discovery phase.',
              },
              {
                q: 'Do you offer ongoing support?',
                a: 'Yes! We offer various maintenance and support packages to ensure your project continues to run smoothly after launch. This includes security updates, bug fixes, and performance monitoring.',
              },
              {
                q: 'Can you work with our existing team?',
                a: 'Absolutely! We frequently collaborate with in-house teams, providing additional expertise and resources. We can integrate seamlessly with your existing workflows and tools.',
              },
              {
                q: 'What industries do you specialize in?',
                a: 'We have experience across various industries including tech, healthcare, finance, e-commerce, education, and more. Our diverse background allows us to bring fresh perspectives to every project.',
              },
            ].map((faq, index) => (
              <Reveal key={index} delay={index * 100} type="up">
                <div className="mb-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white">
                      Q
                    </span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-400 pl-9">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
              Ready to Start Your <span className="gradient-text">Project?</span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Let's discuss your ideas and turn them into reality. Our team is ready to help you achieve your goals.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <Link to="/contact">
              <Button size="xl">
                Get in Touch
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