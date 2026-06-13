import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaCheckCircle,
  FaSpinner,
  FaUserCircle,
  FaShieldAlt,
  FaLock,
  FaEnvelope,
  FaIdCard,
} from 'react-icons/fa';
import { MdError, MdSecurity, MdVerifiedUser } from 'react-icons/md';
import { HiBadgeCheck } from 'react-icons/hi';

// ----------------------------------------------------------------------
// ANIMATION VARIANTS
// ----------------------------------------------------------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring', bounce: 0.3 } },
};

const glowPulse = {
  initial: { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
  animate: {
    boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 20px rgba(16, 185, 129, 0)'],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeOut' },
  },
};

const statusItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.15, duration: 0.4 },
  }),
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function GoogleSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // UI States
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [steps, setSteps] = useState([
    { id: 'verified', label: 'Google Account Verified', completed: false },
    { id: 'checking', label: 'Checking Existing Account', completed: false },
    { id: 'creating', label: 'Creating Account If Needed', completed: false },
    { id: 'session', label: 'Generating Secure Session', completed: false },
    { id: 'redirect', label: 'Redirecting To Dashboard', completed: false },
  ]);

  const hasProcessed = useRef(false);
  const redirectTimer = useRef(null);

  // Helper: mark step as completed
  const completeStep = (stepId) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
    );
  };

  // Helper: update progress bar based on completed steps count
  const updateProgress = (completedCount) => {
    setProgress((completedCount / steps.length) * 100);
  };

  // Watch steps changes to update progress
  useEffect(() => {
    const completed = steps.filter((s) => s.completed).length;
    updateProgress(completed);
  }, [steps]);

  // Main authentication flow
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const authenticate = async () => {
      try {
        // 1. Extract token from URL query parameter
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          throw new Error('No authentication token found in URL.');
        }

        // Store token & set default header
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Step 1 completed: Google Account Verified
        completeStep('verified');
        await new Promise((resolve) => setTimeout(resolve, 300)); // subtle delay for animation

        // 2. Fetch user profile from backend
        completeStep('checking');
        const profileRes = await api.get('/auth/me'); // Adjust endpoint to your backend
        if (!profileRes.data.success) throw new Error('Failed to fetch user profile');
        const userData = profileRes.data.data.user;

        // Step 3: Account exists / created (if needed)
        completeStep('creating');
        setUser(userData);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 3. Store user & token in AuthContext (login)
        completeStep('session');
        login(userData, token); // Assuming login function from AuthContext stores user and token

        await new Promise((resolve) => setTimeout(resolve, 200));

        // 4. Step 5: redirect will start after countdown
        completeStep('redirect');

        // Start countdown before redirect
        let seconds = 3;
        const timer = setInterval(() => {
          seconds -= 1;
          setCountdown(seconds);
          if (seconds <= 0) {
            clearInterval(timer);
            // Role-based redirect
            const destination = userData.role === 'freelancer' ? '/dashboard' : '/';
            navigate(destination);
          }
        }, 1000);
        redirectTimer.current = timer;
      } catch (err) {
        console.error('GoogleSuccess Error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        // Cleanup token if error
        localStorage.removeItem('nexus_token');
        delete api.defaults.headers.common['Authorization'];
      }
    };

    authenticate();

    return () => {
      if (redirectTimer.current) clearInterval(redirectTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // ----------------------------------------------------------------------
  // ERROR UI
  // ----------------------------------------------------------------------
  if (error) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-indigo-950/50">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 animate-pulse" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-red-500/20 p-4 mb-4">
                <MdError className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Return To Login
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // SUCCESS UI
  // ----------------------------------------------------------------------
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-indigo-950/40">
      {/* Floating blurred circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute top-[40%] right-[20%] w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] animate-pulse delay-1000" />
        <div className="absolute bottom-[10%] left-[20%] w-56 h-56 bg-purple-500/15 rounded-full blur-[70px] animate-pulse delay-300" />
      </div>

      {/* Floating particles (tiny circles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3,
            }}
            animate={{
              y: [null, -20, 20, -10],
              x: [null, 15, -15, 10],
              opacity: [0.3, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* LEFT COLUMN: Main success content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="space-y-8"
            >
              {/* Logo & Heading */}
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">N</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                  Google Authentication Successful
                </h1>
                <p className="text-gray-400 text-lg">
                  Verifying your account and preparing your dashboard...
                </p>
              </div>

              {/* Success Checkmark + Spinner area */}
              <motion.div
                variants={scaleIn}
                className="flex justify-center lg:justify-start"
              >
                <motion.div
                  className="relative"
                  variants={glowPulse}
                  initial="initial"
                  animate="animate"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm border border-emerald-500/30">
                    <FaCheckCircle className="w-14 h-14 text-emerald-400" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Loading indicator with progress */}
              <div className="space-y-3 max-w-md">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Authentication progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FaSpinner className="animate-spin text-indigo-400" />
                  Please wait while we securely sign you in.
                </p>
              </div>

              {/* Status Steps */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiBadgeCheck className="text-indigo-400" /> Authentication Status
                </h3>
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <motion.div
                      key={step.id}
                      custom={idx}
                      variants={statusItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          step.completed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-gray-500'
                        }`}
                      >
                        {step.completed ? (
                          <FaCheckCircle className="w-3 h-3" />
                        ) : (
                          <FaSpinner className="w-3 h-3 animate-spin" />
                        )}
                      </div>
                      <span
                        className={`${
                          step.completed ? 'text-gray-200' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Countdown */}
              {steps.every((s) => s.completed) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center lg:text-left"
                >
                  <p className="text-gray-400 text-sm">
                    Redirecting in{' '}
                    <span className="font-mono text-emerald-400 text-lg font-bold">
                      {countdown}
                    </span>{' '}
                    seconds...
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* RIGHT COLUMN: User & Security Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              {/* User Info Card */}
              {user && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <FaUserCircle className="w-10 h-10 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{user.name}</h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <FaEnvelope className="w-3 h-3" /> {user.email}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${
                          user.role === 'freelancer'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <FaIdCard className="w-3 h-3" />
                        {user.role === 'freelancer' ? 'Freelancer' : 'Client'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <MdSecurity className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-semibold text-white">Security Overview</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 flex items-center gap-2">
                      <FaLock className="w-3 h-3" /> OAuth 2.0
                    </span>
                    <span className="text-emerald-400">✓ Secure</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 flex items-center gap-2">
                      <MdVerifiedUser className="w-3 h-3" /> JWT Session
                    </span>
                    <span className="text-emerald-400">Encrypted</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <FaShieldAlt className="w-3 h-3" /> Account Protection
                    </span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Extra Premium Glass Note */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 p-4 text-center">
                <p className="text-xs text-gray-400">
                  🔒 Secure, enterprise-grade authentication powered by Google OAuth
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}