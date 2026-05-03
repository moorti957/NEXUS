import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Our Work', path: '/services' },
      { name: 'Blog', path: '/blog' },
      { name: 'Contact', path: '/contact' },
    ],
    services: [
      { name: 'Web Development', path: '/services#web' },
      { name: 'UI/UX Design', path: '/services#design' },
      { name: 'Digital Marketing', path: '/services#marketing' },
      { name: 'Brand Identity', path: '/services#branding' },
    ],
 support: [
  { name: 'Help Center', path: '/help' },
  { name: 'Terms of Service', path: '/terms' }, // 👈 yaha change
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Cookie Policy', path: '/cookie' },
],
    social: [
      { 
        name: 'Twitter', 
        icon: '𝕏', 
        url: 'https://twitter.com',
        hoverColor: 'hover:bg-indigo-500'
      },
      { 
        name: 'Instagram', 
        icon: '📷', 
        url: 'https://instagram.com',
        hoverColor: 'hover:bg-purple-500'
      },
      { 
        name: 'LinkedIn', 
        icon: '🔗', 
        url: 'https://linkedin.com',
        hoverColor: 'hover:bg-pink-500'
      },
      { 
        name: 'GitHub', 
        icon: '💻', 
        url: 'https://github.com',
        hoverColor: 'hover:bg-indigo-500'
      },
    ],
  };

  return (
    <footer className="relative z-10 border-t border-white/10 mt-auto bg-black/20 backdrop-blur-sm">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top Section - Logo & Description */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 glow-primary">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                NEXUS
              </span>
            </Link>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              Creating exceptional digital experiences that drive business growth and inspire innovation. 
              We blend creativity with technology to build products that make a difference.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-300">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-bold font-display mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Company
            </h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-indigo-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-lg font-bold font-display mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Services
            </h3>
            <ul className="space-y-4">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h3 className="text-lg font-bold font-display mb-6 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              Support
            </h3>
            <ul className="space-y-4 mb-8">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-pink-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 (797) 651-9723</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>dipanshusharma5334@gmail.com  </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ramgarh Alwar Rajasthan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-gray-500 text-sm">
            © {currentYear} Nexus Digital Agency. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {footerLinks.social.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 transition-all duration-300 ${social.hoverColor} hover:text-white hover:scale-110`}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>

          {/* Payment Methods / Trust Badges */}
          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-xs">SSL Secure</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="text-xs">GDPR Compliant</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="text-xs">ISO 27001</span>
          </div>
        </div>

        {/* Back to Top Button (floating) */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-indigo-500/30 hover:scale-110 transition-all duration-300 z-50"
          aria-label="Back to top"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      </div>
    </footer>
  );
}