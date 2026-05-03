    import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';

export default function Terms() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-4">
              Legal
            </span>
            <h1 className="text-5xl md:text-6xl font-bold font-display mb-4">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using our platform.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Last updated: March 19, 2026
            </p>
          </div>
        </Reveal>

        {/* Terms Content Card */}
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
                  Welcome to Nexus Agency ("Company", "we", "our", "us"). By accessing or using our website, services, or applications (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all the terms, you may not access or use our Services.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  These Terms apply to all visitors, users, and others who wish to access or use our Services. Please read them carefully.
                </p>
              </section>

              {/* Eligibility */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  2. Eligibility
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  You must be at least 18 years old to use our Services. By agreeing to these Terms, you represent and warrant that you are of legal age and have the authority to enter into this agreement.
                </p>
              </section>

              {/* Account Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  3. Account Terms
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  To use certain features of our Services, you may be required to create an account. You are responsible for maintaining the security of your account and password. You must provide accurate and complete information. You are solely responsible for all activities that occur under your account.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  We reserve the right to suspend or terminate your account if any information provided proves inaccurate, false, or outdated, or if you violate these Terms.
                </p>
              </section>

              {/* Services */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  4. Services
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Nexus Agency provides digital agency services including web development, design, marketing, and consulting. We strive to deliver high-quality work, but we do not guarantee that our services will meet your specific requirements or that they will be error-free.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  We may modify, suspend, or discontinue any part of our Services at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation.
                </p>
              </section>

              {/* Payments */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  5. Payments and Fees
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Some of our Services are offered on a paid basis. All fees are non-refundable except as required by law or as expressly stated. You agree to provide accurate payment information and authorize us to charge the applicable fees.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  We reserve the right to change our prices at any time. Any price changes will be effective immediately for new orders, and for existing subscriptions, we will provide at least 30 days' notice before the change takes effect.
                </p>
              </section>

              {/* Intellectual Property */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  6. Intellectual Property
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  The Services and all content, features, and functionality (including but not limited to text, graphics, logos, images, and software) are owned by Nexus Agency or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent.
                </p>
              </section>

              {/* User Content */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  7. User Content
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  By submitting, posting, or displaying content on or through our Services, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content solely for the purpose of providing and improving the Services.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You represent and warrant that you own or have the necessary rights to any content you submit and that it does not violate any third-party rights.
                </p>
              </section>

              {/* Prohibited Conduct */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  8. Prohibited Conduct
                </h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Violate any applicable laws or regulations.</li>
                  <li>Impersonate any person or entity.</li>
                  <li>Interfere with or disrupt the Services.</li>
                  <li>Attempt to gain unauthorized access to our systems.</li>
                  <li>Use the Services for any illegal or unauthorized purpose.</li>
                </ul>
              </section>

              {/* Termination */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  9. Termination
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Upon termination, your right to use the Services will cease immediately. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                </p>
              </section>

              {/* Disclaimer */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  10. Disclaimer of Warranties
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  The Services are provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the operation or availability of the Services, or the information, content, and materials included therein.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  To the fullest extent permitted by law, we disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  11. Limitation of Liability
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  In no event shall Nexus Agency, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your use or inability to use the Services; (ii) any unauthorized access to or use of our servers and/or any personal information stored therein.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Our total liability to you for all claims arising out of or relating to these Terms or your use of the Services shall not exceed the amount you paid us, if any, during the twelve months prior to the event giving rise to the liability.
                </p>
              </section>

              {/* Indemnification */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  12. Indemnification
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  You agree to defend, indemnify, and hold harmless Nexus Agency and its employees, contractors, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from: (i) your use of and access to the Services; (ii) your violation of any term of these Terms; (iii) your violation of any third-party right, including without limitation any copyright, property, or privacy right.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  13. Governing Law
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  These Terms shall be governed and construed in accordance with the laws of the United States and the State of California, without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  14. Changes to Terms
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Services.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  15. Contact Us
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about these Terms, please contact us at:
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