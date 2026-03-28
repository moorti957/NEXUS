import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';

export default function HelpCenter() {
  const categories = [
    { icon: '🔐', title: 'Account & Login', desc: 'Manage your account, password, and security settings.', articles: 12 },
    { icon: '💰', title: 'Billing & Payments', desc: 'Invoices, payment methods, and subscription plans.', articles: 8 },
    { icon: '🛠️', title: 'Technical Support', desc: 'Troubleshooting, error messages, and system requirements.', articles: 15 },
    { icon: '📁', title: 'Projects & Tasks', desc: 'Creating, managing, and collaborating on projects.', articles: 10 },
    { icon: '👥', title: 'Team Management', desc: 'Inviting members, roles, and permissions.', articles: 7 },
    { icon: '📞', title: 'Contact & Support', desc: 'Ways to get in touch with our support team.', articles: 5 },
  ];

  const popularArticles = [
    { title: 'How to reset your password', link: '/help/reset-password' },
    { title: 'Understanding project roles', link: '/help/project-roles' },
    { title: 'Payment methods accepted', link: '/help/payment-methods' },
    { title: 'Inviting team members', link: '/help/invite-team' },
    { title: 'Troubleshooting login issues', link: '/help/login-issues' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-4">
              Support
            </span>
            <h1 className="text-5xl md:text-6xl font-bold font-display mb-4">
              Help <span className="gradient-text">Center</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Find answers, get support, and learn how to make the most of Nexus.
            </p>
          </div>
        </Reveal>

        {/* Search Bar */}
        <Reveal delay={200}>
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <span className="pl-5 text-gray-400 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="Search for answers..."
                  className="w-full px-4 py-4 bg-transparent focus:outline-none text-white placeholder-gray-500"
                />
                <button className="mr-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-sm font-medium hover:shadow-lg transition-all">
                  Search
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Categories */}
        <Reveal delay={300}>
          <h2 className="text-3xl font-bold text-center mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <Reveal key={cat.title} delay={index * 100} type="scale">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group cursor-pointer">
                  <div className="text-4xl mb-4">{cat.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{cat.articles} articles</span>
                    <span className="text-indigo-400 text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Popular Articles & Contact */}
        <div className="grid lg:grid-cols-3 gap-8 mt-20">
          {/* Popular Articles */}
          <Reveal type="left" className="lg:col-span-2">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📌</span>
                Popular Articles
              </h2>
              <div className="space-y-4">
                {popularArticles.map((article) => (
                  <Link
                    key={article.title}
                    to={article.link}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition group"
                  >
                    <span className="text-gray-300 group-hover:text-white">{article.title}</span>
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition">→</span>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to="/help/articles">
                  <Button variant="glass">View All Articles</Button>
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Contact Support */}
          <Reveal type="right">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                Contact Support
              </h2>
              <p className="text-gray-400 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="text-sm text-gray-400">Email us</p>
                    <a href="mailto:support@nexus.agency" className="text-indigo-400 hover:underline">
                      support@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <span className="text-xl">💬</span>
                  <div>
                    <p className="text-sm text-gray-400">Live chat</p>
                    <p className="text-white">Available 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="text-sm text-gray-400">Call us</p>
                    <p className="text-white">+91 (797) 651-9723</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button fullWidth>Start Live Chat</Button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* FAQ Preview */}
        <Reveal delay={400} className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left">
            {[
              { q: 'How do I create a new project?', a: 'Navigate to the Projects tab and click "New Project". Fill in the required details and assign team members.' },
              { q: 'Can I change my email address?', a: 'Yes, you can update your email in Profile Settings.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers.' },
            ].map((faq, idx) => (
              <div key={idx} className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-bold mb-1">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
          <Link to="/help/faq" className="inline-block mt-4 text-indigo-400 hover:underline">
            View all FAQs →
          </Link>
        </Reveal>

        {/* Back to Home */}
        <Reveal delay={500} className="mt-16 text-center">
          <Link to="/">
            <Button variant="glass">
              ← Back to Home
            </Button>
          </Link>
        </Reveal>
      </div>
    </div>
  );
}