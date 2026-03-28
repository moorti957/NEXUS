// src/data/projects.js

import ecommerceImg from '../assets/image.png';
import ss1 from '../assets/ss1.png'
import ss2 from '../assets/ss2.png'
import ss3 from '../assets/ss3.png'
import ss4 from '../assets/ss4.png'
import ss5 from '../assets/ss5.png'
import ss6 from '../assets/ss6.png'
import banner from '../assets/banner.png';
import aa1 from '../assets/aa1.png';
import aa2 from '../assets/aa2.png';
import aa3 from '../assets/aa3.png';
import aa4 from '../assets/aa4.png';
import aa5 from '../assets/aa5.png';
import aa6 from '../assets/aa6.png';
import banner3 from '../assets/bnner3.png';
import bb1 from '../assets/bb1.png';
import bb2 from '../assets/bb2.png';
import bb3 from '../assets/bb3.png';
import bb4 from '../assets/bb4.png';
import bb5 from '../assets/bb5.png';
import bb6 from '../assets/bb6.png';
import bb7 from '../assets/bb7.png';
import bb8 from '../assets/bb8.png';
import bb9 from '../assets/bb9.png';

// Feature Icons (simplified – replace with your own SVGs if desired)
const FeatureIcon = ({ type }) => {
  switch (type) {
    case 'auth':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'cart':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'payment':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'tracking':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'workout':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'nutrition':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      );
    case 'social':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'plan':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'wearable':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'logo':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'color':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'type':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    case 'card':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'guide':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'marketing':
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      );
      case 'car':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M7 16h.01M17 16h.01M6 16a2 2 0 104 0 2 2 0 10-4 0zm8 0a2 2 0 104 0 2 2 0 10-4 0z" />
    </svg>
  );

case 'sell':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-3 0-5 2-5 4s2 4 5 4 5-2 5-4-2-4-5-4zm0 0V4m0 12v4" />
    </svg>
  );

case 'branding':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h6m-6 5h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  );

case 'chart':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3v18M5 12h6m2 0h6" />
    </svg>
  );

case 'chat':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5m9-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

case 'rating':
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.26h6.588c.969 0 1.371 1.24.588 1.81l-5.33 3.873 2.036 6.26c.3.921-.755 1.688-1.538 1.118L12 18.347l-5.33 3.901c-.783.57-1.838-.197-1.538-1.118l2.036-6.26-5.33-3.873c-.783-.57-.38-1.81.588-1.81h6.588l2.036-6.26z" />
    </svg>
  );
    default:
      return null;
  }
};

export const projects = {
  ecommerce: {
    title: 'E-Commerce Platform',
    liveUrl: 'https://jay-shree-kisan-com-bv2o.vercel.app/', // ✅ add this
    slug: 'ecommerce-platform',
    shortDesc: 'A modern, scalable online store with seamless shopping experience.',
    heroImage: ecommerceImg,
    gradient: 'from-indigo-500/20 to-purple-600/20',
    overview: 'This e-commerce platform was built for a fashion retailer looking to expand their online presence. The site handles thousands of products, secure payments, and provides a smooth shopping experience across all devices.',
    features: [
      { title: 'Secure Authentication', description: 'User registration, login, and password recovery with JWT.', icon: <FeatureIcon type="auth" /> },
      { title: 'Product Catalog', description: 'Advanced filtering, search, and category management.', icon: <FeatureIcon type="dashboard" /> },
      { title: 'Shopping Cart', description: 'Real-time cart updates, quantity changes, and saved items.', icon: <FeatureIcon type="cart" /> },
      { title: 'Payment Integration', description: 'Stripe and PayPal support for secure transactions.', icon: <FeatureIcon type="payment" /> },
      { title: 'Admin Dashboard', description: 'Manage products, orders, and customers with ease.', icon: <FeatureIcon type="dashboard" /> },
      { title: 'Order Tracking', description: 'Real-time order status and shipping updates.', icon: <FeatureIcon type="tracking" /> },
    ],
   screenshots: [
  ss1,
  ss2,
  ss3,
  ss4,
  ss5,
  ss6,
],
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Stripe API'],
  },
  fitness: {
    title: 'Bastev Mobile App',
    liveUrl: 'https://car-app.com', // ✅ different link
    slug: 'fitness-tracker',
    shortDesc: 'A mobile app that helps users buy, sell, and brand cars. Users can explore new and used cars, list their vehicles for sale, and add custom car branding or advertising.',
    heroImage: banner,
    gradient: 'from-purple-500/20 to-pink-600/20',
    overview: 'A mobile app that allows users to buy and sell new or used cars while also offering car branding and advertising services. Users can easily list vehicles, explore available cars, and customize their cars with branding options.',
    features: [
  { 
    title: 'Car Listings', 
    description: 'Browse a wide range of new and used cars with detailed photos, prices, and specifications.', 
    icon: <FeatureIcon type="car" /> 
  },
  { 
    title: 'Sell Your Car', 
    description: 'List your car easily, add images and details, and connect with potential buyers.', 
    icon: <FeatureIcon type="sell" /> 
  },
  { 
    title: 'Car Branding', 
    description: 'Apply custom branding, wraps, or advertisements to your car with professional designs.', 
    icon: <FeatureIcon type="branding" /> 
  },
  { 
    title: 'Price Insights', 
    description: 'Check market price trends to buy or sell cars at the best value.', 
    icon: <FeatureIcon type="chart" /> 
  },
  { 
    title: 'Direct Chat', 
    description: 'Chat directly with buyers and sellers to negotiate deals quickly.', 
    icon: <FeatureIcon type="chat" /> 
  },
  { 
    title: 'Reviews & Ratings', 
    description: 'See reviews and ratings of sellers and buyers for a safe and trusted experience.', 
    icon: <FeatureIcon type="rating" /> 
  },
],
    screenshots: [
  aa1,
  aa2,
  aa3,
  aa4,
  aa5,
  aa6,

    ],
   techStack: [
  'Flutter',
  'Dart',
  'Firebase',
  'Provider / Riverpod',
  'REST API',
  'Google Maps API',
  'Cloud Firestore'
],
  },
  startup: {
  title: 'PdfBazaar.',
  liveUrl: 'https://pdf-bazaar-com.vercel.app/', // 🔥 यहाँ अपना असली URL डालना
  slug: 'pdf-fasa',
  shortDesc: 'A smart platform to buy, sell, and access premium PDF content easily and securely.',

  heroImage: banner3,

  gradient: 'from-blue-800/20 to-blue-600/20',

  overview: 'PDF Fasa is a modern digital marketplace where users can upload, explore, and purchase high-quality PDF content. The platform is designed to provide a seamless experience for both sellers and buyers. Users can easily list their PDFs, set prices, and earn money, while buyers can securely browse and download premium documents instantly.',

  features: [
    {
      title: 'Upload & Manage PDFs',
      description: 'Easily upload, organize, and manage your PDF files in one place.',
      icon: <FeatureIcon type="dashboard" />
    },
    {
      title: 'Sell Digital Content',
      description: 'Set pricing and sell your PDFs directly to users with ease.',
      icon: <FeatureIcon type="payment" />
    },
    {
      title: 'Secure Authentication',
      description: 'User login and registration system with full security.',
      icon: <FeatureIcon type="auth" />
    },
    {
      title: 'Instant Download',
      description: 'Buyers can instantly download purchased PDFs anytime.',
      icon: <FeatureIcon type="tracking" />
    },
    {
      title: 'Admin Dashboard',
      description: 'Control users, PDFs, and transactions from a powerful admin panel.',
      icon: <FeatureIcon type="dashboard" />
    },
    {
      title: 'Clean & Responsive UI',
      description: 'Simple, fast, and mobile-friendly user interface.',
      icon: <FeatureIcon type="color" />
    },
  ],

  screenshots: [
    bb1,
    bb2,
    bb3,
    bb4,
    bb5,
    bb6,
    bb7,
    bb8,
    bb9,
  ],

  techStack: [
    'React.js',
    'Node.js',
    'Express.js',
    'MongoDB',
    'CSS',
    'REST API'
  ],
}
};