import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, login: authLogin, register: authRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
 const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false,
  accessKey: ''   // NEW FIELD
});
  const [errors, setErrors] = useState({});
  const [apiErrors, setApiErrors] = useState([]);

  // Redirect if already logged in
useEffect(() => {
  if (!user) return;

  if (user.role === "admin") {
    navigate('/dashboard');
  } else {
    navigate('/');
  }
}, [user, navigate]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch(strength) {
      case 0: return { text: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500' };
      case 1: return { text: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500' };
      case 2: return { text: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500' };
      case 3: return { text: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' };
      case 4: return { text: 'Strong', color: 'text-green-500', bg: 'bg-green-500' };
      case 5: return { text: 'Very Strong', color: 'text-green-600', bg: 'bg-green-600' };
      default: return { text: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500' };
    }
  };

  const passwordStrength = checkPasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (passwordStrength < 3) {
        newErrors.passwordStrength = 'Password is too weak';
      }
    }

    return newErrors;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    // Clear API errors on input change
    setApiErrors([]);
  };

  // Handle login submit
  const handleLogin = async () => {
    try {
     const response = await api.post('/auth/login', {
  email: formData.email,
  password: formData.password,
  rememberMe: formData.rememberMe,
  accessKey: formData.accessKey
});

     if (response.data.success) {

  const loggedUser = response.data.data.user;

  authLogin(loggedUser, response.data.data.token);
  showToast(response.data.message || 'Login successful!', 'success');

  if (loggedUser.role === "admin") {
    navigate('/dashboard');
  } else {
    navigate('/');
  }
}
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        if (error.response.data.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setApiErrors([error.response.data.message || 'Login failed']);
        }
        showToast(error.response.data.message || 'Login failed', 'error');
      } else if (error.request) {
        setApiErrors(['Network error. Please check your connection.']);
        showToast('Network error. Please try again.', 'error');
      } else {
        setApiErrors(['An unexpected error occurred.']);
        showToast('An unexpected error occurred.', 'error');
      }
    }
  };

  // Handle register submit
  const handleRegister = async () => {
    try {
      const response = await api.post('/auth/register', {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  confirmPassword: formData.confirmPassword,
  accessKey: formData.accessKey
});

  const loggedUser = response.data.data.user;

authRegister(loggedUser, response.data.data.token);
showToast(response.data.message || 'Registration successful!', 'success');

if (loggedUser.role === "admin") {
  navigate('/dashboard');
} else {
  navigate('/');
}
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response) {
        if (error.response.data.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setApiErrors([error.response.data.message || 'Registration failed']);
        }
        showToast(error.response.data.message || 'Registration failed', 'error');
      } else if (error.request) {
        setApiErrors(['Network error. Please check your connection.']);
        showToast('Network error. Please try again.', 'error');
      } else {
        setApiErrors(['An unexpected error occurred.']);
        showToast('An unexpected error occurred.', 'error');
      }
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    setApiErrors([]);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      showToast('Please enter your email', 'error');
      return;
    }

    setLoading(true);
    setApiErrors([]);
    
    try {
      const response = await api.post('/auth/forgot-password', {
        email: formData.email,
      });

      if (response.data.success) {
        showToast(response.data.message || 'Password reset link sent to your email!', 'success');
        setShowResetPassword(false);
        setFormData(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.response) {
        setApiErrors([error.response.data.message || 'Failed to send reset link']);
        showToast(error.response.data.message || 'Failed to send reset link', 'error');
      } else if (error.request) {
        setApiErrors(['Network error. Please check your connection.']);
        showToast('Network error. Please try again.', 'error');
      } else {
        setApiErrors(['An unexpected error occurred.']);
        showToast('An unexpected error occurred.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle mode
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setApiErrors([]);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false,
    });
  };

  return (
    <div className="min-h-screen   from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0  bg-grid-pattern opacity-5"></div>
      
      {/* Main Container - Full screen with centered card */}
      <div className="relative min-h-screen  flex items-center justify-center p-6 lg:p-8">
        {/* Large Centered Card Container */}
        <div className="w-full max-w-6xl mt-20 mx-auto">
          <div className="grid lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            
            {/* Left Panel - Branding & Info (Desktop) */}
            <div className="hidden lg:block relative bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-12">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                {/* Company Logo & Name */}
                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold font-display text-white">NEXUS</h1>
                      <p className="text-indigo-300">Enterprise Dashboard</p>
                    </div>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">Welcome Back!</h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Access your enterprise dashboard to manage projects, track analytics, and collaborate with your team.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-5 mb-12">
                  {[
                    { icon: '📊', text: 'Real-time Analytics Dashboard' },
                    { icon: '🔒', text: 'Enterprise-grade Security' },
                    { icon: '🤝', text: 'Team Collaboration Tools' },
                    { icon: '📈', text: 'Performance Reports' },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                        {feature.icon}
                      </div>
                      <span className="text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial/Stats */}
                <div className="mt-auto pt-8 border-t border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/20 flex items-center justify-center text-sm font-bold text-white">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-yellow-400 text-lg">★★★★★</div>
                      <p className="text-sm text-gray-400">Trusted by 500+ companies</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="p-8 lg:p-12">
              <div className="max-w-md mx-auto w-full">
                {/* Mobile Logo (visible only on mobile) */}
                <div className="lg:hidden text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">NEXUS</h2>
                  <p className="text-gray-400">Enterprise Dashboard</p>
                </div>

                {/* Header */}
                <div className="text-center lg:text-left mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {showResetPassword 
                      ? 'Reset Password' 
                      : isLogin 
                        ? 'Sign In' 
                        : 'Create Account'
                    }
                  </h2>
                  <p className="text-gray-400">
                    {showResetPassword
                      ? 'Enter your email to receive reset instructions'
                      : isLogin
                        ? 'Please enter your credentials to access your account'
                        : 'Fill in the details below to get started'
                    }
                  </p>
                </div>

                {/* API Error Messages */}
                {apiErrors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {apiErrors.map((error, index) => (
                      <p key={index} className="text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Form */}
                {showResetPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder-gray-500"
                          placeholder="john@company.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button type="submit" size="lg" fullWidth loading={loading}>
                        Send Reset Link
                      </Button>
                      
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(false)}
                        className="w-full text-sm text-indigo-400 hover:text-indigo-300 transition-colors py-2"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Field (Register only) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                              errors.name ? 'border-red-500/50' : 'border-white/10'
                            }`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                        )}
                      </div>
                    )}

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                            errors.email ? 'border-red-500/50' : 'border-white/10'
                          }`}
                          placeholder="john@company.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                            errors.password || errors.passwordStrength ? 'border-red-500/50' : 'border-white/10'
                          }`}
                          placeholder="••••••••"
                        />
                      </div>

                      {/* Password Strength (Register only) */}
                      {!isLogin && formData.password && (
                        <div className="mt-3">
                          <div className="flex gap-1 mb-2">
                            {[1,2,3,4,5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                  level <= passwordStrength ? strengthInfo.bg : 'bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs ${strengthInfo.color}`}>
                            {strengthInfo.text} password
                          </p>
                        </div>
                      )}

                      {errors.password && (
                        <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                      )}
                      {errors.passwordStrength && (
                        <p className="mt-1 text-xs text-red-400">{errors.passwordStrength}</p>
                      )}
                    </div>

                    {/* Optional Access Key */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Access Key (Optional)
  </label>

  <input
    type="text"
    name="accessKey"
    value={formData.accessKey}
    onChange={handleChange}
    placeholder="Enter special access key"
    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
  />
</div>

                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                              errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                            }`}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                        )}
                      </div>
                    )}

                    {/* Remember Me & Forgot Password (Login only) */}
                    {isLogin && (
                      <div className="flex items-center justify-between py-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            className="w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-indigo-500"
                          />
                          <span className="text-sm text-gray-400">Remember me</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowResetPassword(true)}
                          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button type="submit" size="lg" fullWidth loading={loading}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>

                    {/* Toggle Mode */}
                    <p className="text-center text-sm text-gray-400 pt-4">
                      {isLogin ? "New to Nexus? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        {isLogin ? 'Create an account' : 'Sign in'}
                      </button>
                    </p>
                  </form>
                )}

                {/* Social Login (Optional) */}
                {!showResetPassword && (
                  <div className="mt-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#1a1a24] text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <button className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        </svg>
                      </button>
                      <button className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </button>
                      <button className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.775-5.804 14.01 14.01 0 001.544-6.187c0-.21-.005-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Grid Pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}