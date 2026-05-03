import { useState } from 'react';
import Reveal       from '../components/common/Reveal';
import Button       from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth }  from '../context/AuthContext';
import api          from '../services/api'; // ← use your real axios instance

export default function Contact() {
  const { user }     = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name:       user?.name  || '',
    email:      user?.email || '',
    company:    '',
    phone:      '',
    service:    '',
    budget:     '',
    message:    '',
    newsletter: false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim())    e.name    = 'Name is required';
    if (!formData.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
    if (!formData.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      // ── Real API call ────────────────────────────────────────────────────
      const response = await api.post('/contact', formData);

      if (response.data.success) {
        showToast(response.data.message || "Message sent! We'll be in touch soon.", 'success');

        // Reset form
        setFormData({
          name:       user?.name  || '',
          email:      user?.email || '',
          company:    '',
          phone:      '',
          service:    '',
          budget:     '',
          message:    '',
          newsletter: false,
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      id: 1,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      details: '+91 (797) 651-9723',
      subdetails: 'Mon-Fri, 9am-6pm EST',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      id: 2,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      details: 'dipanshusharma5334@gmail.com',
      subdetails: 'We reply within 24 hours',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      id: 3,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Office',
      details: 'Ramgarh Alwar Rajasthan',
      subdetails: '548 Market St, Suite 7658',
      gradient: 'from-pink-500 to-orange-600',
    },
  ];

  const services = ['Web Development','UI/UX Design','Digital Marketing','Brand Identity','Mobile App Development','Tech Consulting'];
  const budgets  = ['Less than $5,000','$5,000 - $10,000','$10,000 - $25,000','$25,000 - $50,000','$50,000 - $100,000','$100,000+'];

  const faqs = [
    { q: 'How quickly do you respond to inquiries?', a: 'We typically respond within 24 hours during business days. For urgent matters, we recommend giving us a call.' },
    { q: 'Do you work with international clients?',  a: "Absolutely! We have clients worldwide and are experienced in working across different time zones." },
    { q: 'What information should I provide?',       a: 'The more details, the better! Share your project goals, timeline, budget range, and any specific requirements.' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <Reveal>
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
              Contact Us
            </span>
          </Reveal>
          <Reveal delay={200}>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
              Let's <span className="gradient-text">Connect</span>
            </h1>
          </Reveal>
          <Reveal delay={400}>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Have a project in mind? We'd love to hear about it. Reach out and let's start a conversation.
            </p>
          </Reveal>
        </div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {contactInfo.map((info, index) => (
            <Reveal key={info.id} delay={index * 200} type="scale">
              <div className="group relative">
                <div className={`p-8 rounded-2xl bg-gradient-to-br ${info.gradient}/10 border border-white/10 backdrop-blur-sm transition-all duration-500 text-center`}>
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${info.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">{info.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{info.title}</h3>
                  <p className="text-lg font-medium text-white mb-1">{info.details}</p>
                  <p className="text-sm text-gray-400">{info.subdetails}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Form + Map */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <Reveal type="left">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name <span className="text-red-400">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'}`}
                      placeholder="John Doe" />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email <span className="text-red-400">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'}`}
                      placeholder="john@example.com" />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="Your Company" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="+1 (555) 123-4567" />
                  </div>
                </div>

                {/* Service & Budget */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <select name="service" value={formData.service} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                      <option value="">Select a service</option>
                      {services.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget Range</label>
                    <select name="budget" value={formData.budget} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                      <option value="">Select budget</option>
                      {budgets.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">Message <span className="text-red-400">*</span></label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows="6"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none ${errors.message ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500'}`}
                    placeholder="Tell us about your project..." />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>

                {/* Newsletter */}
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="newsletter" id="newsletter" checked={formData.newsletter} onChange={handleChange} className="w-5 h-5 rounded bg-white/5 border border-white/10 checked:bg-indigo-500" />
                  <label htmlFor="newsletter" className="text-sm text-gray-400">Subscribe to our newsletter for updates and insights</label>
                </div>

                <Button type="submit" size="lg" fullWidth loading={loading}>Send Message</Button>
                <p className="text-xs text-gray-500 text-center">* Required fields. We'll get back to you within 24 hours.</p>
              </form>
            </div>
          </Reveal>

          {/* Map + Hours + Social */}
          <Reveal type="right">
            <div className="space-y-6">
              <div className="h-80 rounded-3xl overflow-hidden border border-white/10">
                <iframe title="Office Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019872430126!2d-122.419418484682!3d37.774929279759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c5e3b8c7d%3A0x1c7b3b4b3b4b3b4b!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" className="filter grayscale invert-[0.1]" />
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Office Hours
                </h3>
                <div className="space-y-2 text-sm">
                  {[['Monday - Friday','9:00 AM - 6:00 PM'],['Saturday','10:00 AM - 4:00 PM'],['Sunday','Closed']].map(([day, hours]) => (
                    <div key={day} className="flex justify-between"><span className="text-gray-400">{day}</span><span className="text-white">{hours}</span></div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {[{ name: 'Twitter', icon: '𝕏', color: 'hover:bg-indigo-500' },{ name: 'LinkedIn', icon: '🔗', color: 'hover:bg-purple-500' },{ name: 'Instagram', icon: '📷', color: 'hover:bg-pink-500' },{ name: 'GitHub', icon: '💻', color: 'hover:bg-orange-500' }].map((social) => (
                    <a key={social.name} href="#" className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl transition-all duration-300 ${social.color} hover:text-white hover:scale-110`}>{social.icon}</a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </Reveal>
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <Reveal key={index} delay={index * 200} type="up">
                <div className="mb-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white">Q</span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-400 pl-9">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Prefer to <span className="gradient-text">call?</span></h2></Reveal>
          <Reveal delay={200}><p className="text-gray-400 mb-6">We're available by phone Monday through Friday, 9am-6pm EST.</p></Reveal>
          <Reveal delay={400}>
            <a href="tel:+15551234567" className="inline-flex items-center gap-3 text-2xl font-bold gradient-text hover:opacity-80 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              +91 (797) 651-9723
            </a>
          </Reveal>
        </div>
      </div>
    </div>
  );
}