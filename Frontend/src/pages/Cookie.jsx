import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';

export default function Cookie() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-4">
              Legal
            </span>
            <h1 className="text-5xl md:text-6xl font-bold font-display mb-4">
              Cookie <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              How we use cookies and similar technologies.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Last updated: March 19, 2026
            </p>
          </div>
        </Reveal>

        {/* Cookie Policy Content Card */}
        <Reveal delay={200}>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl">
            <div className="prose prose-invert max-w-none">
              {/* Introduction */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  1. Introduction
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Nexus Agency ("Company", "we", "our", "us") uses cookies and similar tracking technologies on our website and services. This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  By continuing to use our website, you consent to our use of cookies in accordance with this policy. If you do not agree to our use of cookies, please adjust your browser settings accordingly or refrain from using our website.
                </p>
              </section>

              {/* What Are Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  2. What Are Cookies?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently, enhance user experience, and provide information to the website owners.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device when you go offline, while session cookies are deleted as soon as you close your web browser.
                </p>
              </section>

              {/* Types of Cookies We Use */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  3. Types of Cookies We Use
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use the following categories of cookies:
                </p>
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="font-bold text-indigo-400 mb-2">Essential Cookies</h3>
                    <p className="text-gray-300 text-sm">
                      These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="font-bold text-indigo-400 mb-2">Performance Cookies</h3>
                    <p className="text-gray-300 text-sm">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They help us improve the website's performance.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="font-bold text-indigo-400 mb-2">Functionality Cookies</h3>
                    <p className="text-gray-300 text-sm">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences (e.g., language, region). They may be set by us or by third-party providers.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="font-bold text-indigo-400 mb-2">Targeting/Advertising Cookies</h3>
                    <p className="text-gray-300 text-sm">
                      These cookies are used to deliver advertisements more relevant to you and your interests. They also limit the number of times you see an ad and help measure the effectiveness of advertising campaigns.
                    </p>
                  </div>
                </div>
              </section>

              {/* Third-Party Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  4. Third-Party Cookies
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on. These cookies may be set by:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mt-4">
                  <li>Analytics providers (e.g., Google Analytics)</li>
                  <li>Advertising networks</li>
                  <li>Social media platforms (if you interact with their features)</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  These third parties may use cookies to collect information about your online activities over time and across different websites. We do not control these third-party cookies; please refer to their respective privacy policies for more information.
                </p>
              </section>

              {/* How We Use Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  5. How We Use Cookies
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                  <li>To authenticate users and prevent fraudulent use of accounts.</li>
                  <li>To remember your preferences and settings.</li>
                  <li>To analyze how our website is used and improve its performance.</li>
                  <li>To deliver relevant advertising and measure its effectiveness.</li>
                  <li>To enable social media features (e.g., sharing buttons).</li>
                </ul>
              </section>

              {/* Managing Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  6. Managing Cookies
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse cookies, delete cookies, or alert you when cookies are being sent. However, if you disable or refuse cookies, some parts of our website may become inaccessible or not function properly.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  To learn more about how to manage cookies, visit the help pages of your browser:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mt-2">
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </section>

              {/* Do Not Track Signals */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  7. Do Not Track Signals
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Some browsers have a "Do Not Track" (DNT) feature that lets you tell websites that you do not want to have your online activity tracked. Our website does not currently respond to DNT signals because no uniform standard for such signals has been adopted.
                </p>
              </section>

              {/* Changes to Cookie Policy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  8. Changes to Cookie Policy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date at the top of this policy.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  9. Contact Us
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about our use of cookies, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-gray-300">Nexus Agency</p>
                  <p className="text-gray-300">Ramgarh Alwar Rajasthan</p>
                  <p className="text-gray-300">San Francisco, CA 94104</p>
                  <p className="text-gray-300 mt-2">Email: <a href="mailto:dipanshusharma5334@gmil.com" className="text-indigo-400 hover:underline">dipanshusharma5334@gmil.com</a></p>
                </div>
              </section>
            </div>
          </div>
        </Reveal>

        {/* Back to Home */}
        <Reveal delay={400} className="mt-10 text-center">
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