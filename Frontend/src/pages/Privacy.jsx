import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';

export default function Privacy() {
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
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              How we collect, use, and protect your information.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Last updated: March 19, 2026
            </p>
          </div>
        </Reveal>

        {/* Privacy Content Card */}
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
                  Nexus Agency ("Company", "we", "our", "us") respects your privacy and is committed to protecting it through this Privacy Policy. This policy describes the types of information we may collect from you or that you may provide when you visit our website or use our services, and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Please read this policy carefully to understand our policies and practices regarding your information. If you do not agree with our policies and practices, your choice is not to use our website or services. By accessing or using our website or services, you agree to this privacy policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  2. Information We Collect
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We collect several types of information from and about users of our website and services, including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                  <li><strong>Personal Information:</strong> Name, email address, postal address, phone number, and any other information you provide by filling in forms on our website or when registering for an account.</li>
                  <li><strong>Usage Data:</strong> Information about your internet connection, the equipment you use to access our website, and usage details.</li>
                  <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use information that we collect about you or that you provide to us, including any personal information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                  <li>To present our website and its contents to you.</li>
                  <li>To provide you with information, products, or services that you request from us.</li>
                  <li>To fulfill any other purpose for which you provide it.</li>
                  <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us.</li>
                  <li>To notify you about changes to our website or any services we offer.</li>
                  <li>To allow you to participate in interactive features on our website.</li>
                  <li>In any other way we may describe when you provide the information.</li>
                  <li>For any other purpose with your consent.</li>
                </ul>
              </section>

              {/* Disclosure of Your Information */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  4. Disclosure of Your Information
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may disclose aggregated information about our users without restriction. We may disclose personal information that you provide to us:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                  <li>To our subsidiaries and affiliates.</li>
                  <li>To contractors, service providers, and other third parties we use to support our business.</li>
                  <li>To fulfill the purpose for which you provide it.</li>
                  <li>For any other purpose disclosed by us when you provide the information.</li>
                  <li>With your consent.</li>
                  <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request.</li>
                  <li>To enforce our rights arising from any contracts entered into between you and us.</li>
                  <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of Nexus Agency, our customers, or others.</li>
                </ul>
              </section>

              {/* Data Security */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  5. Data Security
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  The safety and security of your information also depends on you. Where we have given you (or where you have chosen) a password for access to certain parts of our website, you are responsible for keeping this password confidential. We ask you not to share your password with anyone.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our website. Any transmission of personal information is at your own risk.
                </p>
              </section>

              {/* Cookies and Tracking Technologies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  6. Cookies and Tracking Technologies
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use cookies and similar tracking technologies to track the activity on our website and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                </p>
              </section>

              {/* Third-Party Links */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  7. Third-Party Links
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Our website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  8. Children's Privacy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Our website and services are not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from a child without verification of parental consent, we take steps to remove that information from our servers.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  9. Your Rights
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Depending on your jurisdiction, you may have the right to access, correct, update, or delete your personal information. You can do so at any time by contacting us or by using your account settings (if applicable).
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You also have the right to object to processing of your personal information, ask us to restrict processing of your personal information, or request portability of your personal information.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  If we have collected and processed your personal information with your consent, you can withdraw your consent at any time. Withdrawing your consent will not affect the lawfulness of any processing we conducted prior to your withdrawal, nor will it affect processing of your personal information conducted in reliance on lawful processing grounds other than consent.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  10. Data Retention
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  11. Changes to Privacy Policy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                  12. Contact Us
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
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