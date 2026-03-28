// ===========================================
// EMAIL SERVICE - NEXUS AGENCY BACKEND
// ===========================================

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// ===========================================
// EMAIL TRANSPORTER CONFIGURATION
// ===========================================

/**
 * Create email transporter based on environment
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  // For development/testing, use ethereal.email
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email', // Generate at https://ethereal.email
        pass: 'ethereal_password'
      }
    });
  }

  // For production, use configured SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    // Connection pool
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

// Create transporter instance
let transporter;
try {
  transporter = createTransporter();
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

// ===========================================
// EMAIL TEMPLATES
// ===========================================

/**
 * Load HTML template from file
 * @param {string} templateName - Template name
 * @param {Object} replacements - Key-value pairs for replacement
 * @returns {Promise<string>} Rendered HTML
 */
const loadTemplate = async (templateName, replacements = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, replacements[key]);
    });

    return template;
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    return null;
  }
};

/**
 * Generate base email HTML template
 * @param {string} content - Email content
 * @param {string} title - Email title
 * @returns {string} Complete HTML email
 */
const getBaseTemplate = (content, title = 'Nexus Agency') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .email-header {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          padding: 40px 30px;
          text-align: center;
        }
        
        .email-header h1 {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        
        .email-header p {
          color: rgba(255,255,255,0.9);
          font-size: 16px;
        }
        
        .email-content {
          padding: 40px 30px;
          background: #ffffff;
        }
        
        .email-footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .email-footer p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white !important;
          padding: 14px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(99,102,241,0.3);
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 30px 0;
        }
        
        .social-links {
          margin-top: 20px;
        }
        
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #6366f1;
          text-decoration: none;
          font-size: 14px;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
          }
          .email-content {
            padding: 30px 20px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>✨ NEXUS AGENCY</h1>
          <p>Create extraordinary digital experiences</p>
        </div>
        
        <div class="email-content">
          ${content}
        </div>
        
        <div class="email-footer">
          <p>© ${new Date().getFullYear()} Nexus Agency. All rights reserved.</p>
          <p>548 Market St, Suite 12345, San Francisco, CA 94104</p>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            |
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Terms of Service</a>
          </p>
          <div class="social-links">
            <a href="https://twitter.com/nexus">𝕏 Twitter</a>
            <a href="https://linkedin.com/company/nexus">🔗 LinkedIn</a>
            <a href="https://instagram.com/nexus">📷 Instagram</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ===========================================
// EMAIL SENDING FUNCTIONS
// ===========================================

/**
 * Send email using configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {Array} options.attachments - File attachments (optional)
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    // Validate email configuration
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    // Validate recipient
    if (!to || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(to)) {
      throw new Error('Invalid recipient email address');
    }

    const mailOptions = {
      from: `"Nexus Agency" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@nexus.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      attachments,
      headers: {
        'X-Priority': '3', // Normal priority
        'X-Mailer': 'Nexus Agency Mail Service',
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 Email sent:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Message ID: ${info.messageId}`);
      
      // For ethereal.email, show preview URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// ===========================================
// SPECIFIC EMAIL TYPES
// ===========================================

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendResetPasswordEmail = async (email, token, name) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${name},</h2>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      We received a request to reset your password for your Nexus Agency account. 
      Click the button below to set a new password:
    </p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button" style="color: white !important;">
        🔐 Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; margin: 20px 0; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; word-break: break-all; margin-bottom: 20px;">
      <code style="color: #6366f1; font-size: 14px;">${resetUrl}</code>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⚠️ This link will expire in 1 hour.</strong>
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      If you didn't request a password reset, please ignore this email or 
      <a href="${process.env.FRONTEND_URL}/contact" style="color: #6366f1;">contact support</a> 
      if you have concerns.
    </p>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Password Reset Request - Nexus Agency',
    html: getBaseTemplate(content, 'Password Reset'),
  });
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (email, name) => {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
  
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to Nexus, ${name}! 🎉</h2>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      Thank you for joining Nexus Agency! We're excited to have you on board. 
      Your account has been successfully created and you're now ready to explore our platform.
    </p>
    
    <div style="background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <h3 style="color: #0284c7; margin-bottom: 15px;">✨ What you can do now:</h3>
      <ul style="color: #0369a1; list-style-type: none; padding: 0;">
        <li style="margin-bottom: 10px;">✅ Access your personalized dashboard</li>
        <li style="margin-bottom: 10px;">✅ Manage your projects and tasks</li>
        <li style="margin-bottom: 10px;">✅ Connect with our expert team</li>
        <li style="margin-bottom: 10px;">✅ Get real-time updates on your inquiries</li>
        <li>✅ Explore our premium features</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button" style="color: white !important;">
        🚀 Go to Dashboard
      </a>
    </div>
    
    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">📚 Getting Started Resources:</h3>
      <ul style="color: #4b5563;">
        <li style="margin-bottom: 8px;">
          <a href="${process.env.FRONTEND_URL}/docs" style="color: #6366f1;">📖 Platform Documentation</a>
        </li>
        <li style="margin-bottom: 8px;">
          <a href="${process.env.FRONTEND_URL}/tutorials" style="color: #6366f1;">🎓 Video Tutorials</a>
        </li>
        <li style="margin-bottom: 8px;">
          <a href="${process.env.FRONTEND_URL}/faq" style="color: #6366f1;">❓ Frequently Asked Questions</a>
        </li>
      </ul>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      If you have any questions, feel free to reach out to our 
      <a href="${process.env.FRONTEND_URL}/contact" style="color: #6366f1;">support team</a>. 
      We're here to help you succeed!
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Nexus Agency!',
    html: getBaseTemplate(content, 'Welcome to Nexus'),
  });
};

/**
 * Send email verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address, ${name}</h2>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      Thanks for signing up with Nexus Agency! Please verify your email address to activate your account 
      and access all features.
    </p>
    
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button" style="color: white !important;">
        ✅ Verify Email Address
      </a>
    </div>
    
    <div style="background: #e6f7e6; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="color: #047857; margin: 0; font-size: 14px;">
        <strong>⏰ This link will expire in 24 hours.</strong>
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      If you didn't create an account with Nexus Agency, please ignore this email.
    </p>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Verify Your Email - Nexus Agency',
    html: getBaseTemplate(content, 'Email Verification'),
  });
};

/**
 * Send account confirmation email (after verification)
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendAccountConfirmedEmail = async (email, name) => {
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verified Successfully! 🎉</h2>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 60px;">✅</div>
    </div>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      Hi ${name}, your email has been successfully verified. Your account is now fully activated 
      and you can access all features of Nexus Agency.
    </p>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/dashboard" class="button" style="color: white !important;">
        🚀 Go to Dashboard
      </a>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Email Verified - Nexus Agency',
    html: getBaseTemplate(content, 'Email Verified'),
  });
};

/**
 * Send contact form acknowledgment
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendContactAcknowledgment = async (email, name) => {
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Thank You for Contacting Us, ${name}!</h2>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      We've received your message and appreciate you reaching out to Nexus Agency. 
      Our team will review your inquiry and get back to you within 24 hours.
    </p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-bottom: 10px;">📋 What happens next?</h3>
      <ol style="color: #4b5563; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Our team reviews your message</li>
        <li style="margin-bottom: 8px;">We match you with the right expert</li>
        <li style="margin-bottom: 8px;">You'll receive a personalized response via email</li>
        <li>We schedule a call if needed</li>
      </ol>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      In the meantime, feel free to explore our 
      <a href="${process.env.FRONTEND_URL}/services" style="color: #6366f1;">services</a> or check out our 
      <a href="${process.env.FRONTEND_URL}/blog" style="color: #6366f1;">blog</a> for insights and updates.
    </p>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '📬 We Received Your Message - Nexus Agency',
    html: getBaseTemplate(content, 'Contact Acknowledgment'),
  });
};

/**
 * Send contact form notification to admin
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} Send result
 */
const sendContactNotificationToAdmin = async (contactData) => {
  const { name, email, company, phone, service, budget, message } = contactData;
  
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">📬 New Contact Form Submission</h2>
    
    <div style="background: #f3f4f6; border-radius: 12px; padding: 25px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">Contact Details:</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Name:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">
            <a href="mailto:${email}" style="color: #6366f1;">${email}</a>
          </td>
        </tr>
        ${company ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Company:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${company}</td>
        </tr>
        ` : ''}
        ${phone ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Phone:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">
            <a href="tel:${phone}" style="color: #6366f1;">${phone}</a>
          </td>
        </tr>
        ` : ''}
        ${service ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${service}</td>
        </tr>
        ` : ''}
        ${budget ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Budget:</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${budget}</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="margin-top: 20px;">
        <h4 style="color: #1f2937; margin-bottom: 10px;">Message:</h4>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #4b5563;">
          ${message}
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px;">
        Received at: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@nexus.com',
    subject: `📬 New Contact Form Submission from ${name}`,
    html: getBaseTemplate(content, 'New Contact Submission'),
  });
};

/**
 * Send password changed confirmation
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendPasswordChangedEmail = async (email, name) => {
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Password Changed Successfully</h2>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 60px;">🔐</div>
    </div>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      Hi ${name}, your password has been successfully changed.
    </p>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⚠️ If you didn't make this change</strong>, please 
        <a href="${process.env.FRONTEND_URL}/contact" style="color: #6366f1;">contact support immediately</a> 
        and reset your password.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Password Changed - Nexus Agency',
    html: getBaseTemplate(content, 'Password Changed'),
  });
};

/**
 * Send newsletter confirmation
 * @param {string} email - Subscriber email
 * @param {string} name - Subscriber name
 * @returns {Promise<Object>} Send result
 */
const sendNewsletterConfirmation = async (email, name) => {
  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px;">Newsletter Subscription Confirmed! 📬</h2>
    
    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
      Hi ${name}, thank you for subscribing to the Nexus Agency newsletter!
    </p>
    
    <div style="background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <h3 style="color: #0284c7; margin-bottom: 15px;">📰 What you'll receive:</h3>
      <ul style="color: #0369a1; list-style-type: none; padding: 0;">
        <li style="margin-bottom: 10px;">✨ Weekly industry insights</li>
        <li style="margin-bottom: 10px;">🚀 Latest tech trends</li>
        <li style="margin-bottom: 10px;">💡 Tips and tutorials</li>
        <li style="margin-bottom: 10px;">🎁 Exclusive offers and updates</li>
      </ul>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      You can unsubscribe at any time by clicking the link at the bottom of our emails.
    </p>
    
    <div class="divider"></div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>The Nexus Agency Team</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '📬 Newsletter Subscription Confirmed - Nexus Agency',
    html: getBaseTemplate(content, 'Newsletter Confirmation'),
  });
};

// ===========================================
// TEST EMAIL CONFIGURATION
// ===========================================

/**
 * Test email configuration
 * @returns {Promise<Object>} Test result
 */
const testEmailConfig = async () => {
  try {
    const testResult = await sendEmail({
      to: process.env.EMAIL_USER || 'test@example.com',
      subject: '🔧 Test Email - Nexus Agency',
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you're seeing this email, your email configuration is working correctly!</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      `,
    });

    return {
      success: true,
      message: 'Email configuration is working',
      details: testResult,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Email configuration failed',
      error: error.message,
    };
  }
};

// ===========================================
// EXPORT FUNCTIONS
// ===========================================
module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendAccountConfirmedEmail,
  sendContactAcknowledgment,
  sendContactNotificationToAdmin,
  sendPasswordChangedEmail,
  sendNewsletterConfirmation,
  testEmailConfig,
};