import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaChartLine,
  FaLock,
  FaUsers,
  FaChartBar
} from "react-icons/fa";
import { FaGoogle, FaGithub, FaXTwitter } from "react-icons/fa6";

export default function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, login: authLogin, register: authRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Client');
  const [searchParams] = useSearchParams();
  const [resetStep, setResetStep] = useState("email"); // email | otp | password | success
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0); // seconds
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    accessKey: '',
    role: 'Client'
  });
  const [errors, setErrors] = useState({});
  const [apiErrors, setApiErrors] = useState([]);

  // OTP inputs refs
  const otpInputsRef = useRef([]);

  // Password strength checker (same as before)
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
    switch (strength) {
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

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Redirect if already logged in (unchanged)
  useEffect(() => {
    if (!user) return;
    if (user.role === 'Freelancer' && localStorage.getItem(`onboarding_complete_${user.id}`) !== 'true') {
      navigate('/onboarding');
      return;
    }
    if (user.role === 'Freelancer') {
      navigate('/dashboard');
      return;
    }
    navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get("googleError") === "account-not-found") {
      showToast("Account not found. Please create an account first.", "error");
      setIsLogin(false);
    }
  }, []);

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    const newOtpArray = otp.split('');
    newOtpArray[index] = value.slice(-1);
    const newOtp = newOtpArray.join('');
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace: clear current and focus previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData);
      // Focus last input (optional)
      otpInputsRef.current[5]?.focus();
    }
  };

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/send-reset-otp", { email: formData.email });
      if (res.data.success) {
        showToast("OTP sent successfully", "success");
        setResetStep("otp");
        setResendTimer(60);
        setOtp('');
      } else {
        showToast(res.data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/send-reset-otp", { email: formData.email });
      if (res.data.success) {
        showToast("OTP resent successfully", "success");
        setResendTimer(60);
      } else {
        showToast(res.data.message || "Failed to resend OTP", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      showToast("Please enter the 6-digit code", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-reset-otp", {
        email: formData.email,
        otp
      });
      if (res.data.success) {
        setResetStep("password");
        showToast("OTP verified. Now set a new password.", "success");
      } else {
        showToast(res.data.message || "Invalid OTP", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    // Validate password
    if (!formData.password) {
      showToast("Please enter a new password", "error");
      return;
    }
    if (formData.password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (passwordStrength < 3) {
      showToast("Password is too weak. Please use a stronger password.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/update-password-with-otp", {
        email: formData.email,
        otp,
        password: formData.password
      });
      if (res.data.success) {
        setResetStep("success");
        showToast("Password updated successfully!", "success");
        // Clear sensitive fields
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        showToast(res.data.message || "Password update failed", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Back to login from success
  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setResetStep("email");
    setOtp('');
    setFormData(prev => ({ ...prev, email: '', password: '', confirmPassword: '' }));
  };

  // Other existing functions (validateForm, handleChange, handleLogin, handleRegister, toggleMode) remain IDENTICAL
  // I will include them exactly as they were, but to keep the answer size reasonable I'll show the unchanged parts.
  // For brevity, I'll assume they are copied from your original file. In the final code they must be present.

  // ----------------------------------------------------------------------
  // (The following functions are exactly as in your original Auth.jsx)
  // validateForm, handleChange, handleLogin, handleRegister, toggleMode
  // Please copy them from your existing file – they are unchanged.
  // ----------------------------------------------------------------------

  // ==== Placeholder for original functions – replace with your actual code ====
  const validateForm = () => {
    // your original implementation
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (!isLogin && formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!isLogin) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      else if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (passwordStrength < 3) newErrors.passwordStrength = 'Password is too weak';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    setApiErrors([]);
  };

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
        const token = response.data.data.token;
        localStorage.setItem("token", token);
        authLogin(loggedUser, token);
        showToast(response.data.message || 'Login successful!', 'success');
        if (loggedUser.role === "Freelancer") {
          window.location.replace('/dashboard');
        } else {
          window.location.replace('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        if (error.response.data.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => { fieldErrors[err.field] = err.message; });
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

  const handleRegister = async () => {
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        accessKey: formData.accessKey,
        role: formData.role
      });
      const loggedUser = response.data.data.user;
      const token = response.data.data.token;
      authRegister(loggedUser, token);
      localStorage.setItem("token", token);
      showToast(response.data.message || "Registration successful!", "success");
      if (loggedUser.role === "Freelancer") {
        localStorage.setItem(`onboarding_complete_${loggedUser.id}`, "false");
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach((e) => { fieldErrors[e.field] = e.message; });
        setErrors(fieldErrors);
        error.response.data.errors.forEach((e) => showToast(`${e.field}: ${e.message}`, "error"));
      } else if (error.response) {
        setApiErrors([error.response.data.message || "Registration failed"]);
        showToast(error.response.data.message || "Registration failed", "error");
      } else if (error.request) {
        setApiErrors(["Network error. Please check your connection."]);
        showToast("Network error. Please try again.", "error");
      } else {
        setApiErrors(["An unexpected error occurred."]);
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

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
      accessKey: '',
      role: 'Client'
    });
  };
  // ----------------------------------------------------------------------

  // RENDER LOGIC (the JSX) – completely replaced with new reset flow inside
  return (
    <div className="min-h-screen from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative min-h-screen flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-6xl mt-20 mx-auto">
          <div className="grid lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Left Panel - same as original */}
            <div className="hidden lg:block relative bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 h-full flex flex-col">
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
                <div className="mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">Welcome Back!</h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Access your enterprise dashboard to manage projects, track analytics, and collaborate with your team.
                  </p>
                </div>
                <div className="space-y-5 mb-12">
                  {[
                    { icon: FaChartLine, text: 'Real-time Analytics Dashboard' },
                    { icon: FaLock, text: 'Enterprise-grade Security' },
                    { icon: FaUsers, text: 'Team Collaboration Tools' },
                    { icon: FaChartBar, text: 'Performance Reports' },
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Icon className="text-indigo-400 text-lg" />
                        </div>
                        <span className="text-gray-300">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-auto pt-8 border-t border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
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

            {/* Right Panel - Form with improved reset flow */}
            <div className="p-8 lg:p-12">
              <div className="max-w-md mx-auto w-full">
                {/* Mobile Logo */}
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
                      ? resetStep === 'success'
                        ? 'Password Updated'
                        : resetStep === 'password'
                        ? 'Create New Password'
                        : resetStep === 'otp'
                        ? 'Verification Code'
                        : 'Reset Password'
                      : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                  </h2>
                  <p className="text-gray-400">
                    {showResetPassword
                      ? resetStep === 'success'
                        ? 'Your password has been successfully reset.'
                        : resetStep === 'password'
                        ? 'Enter your new password below.'
                        : resetStep === 'otp'
                        ? `We've sent a 6-digit code to ${formData.email}`
                        : 'Enter your email address to receive a verification code.'
                      : isLogin
                      ? 'Please enter your credentials to access your account'
                      : 'Fill in the details below to get started'}
                  </p>
                </div>

                {/* API Errors */}
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

                {/* Reset Password Flow */}
                {showResetPassword && (
                  <>
                    {resetStep === "email" && (
                      <form onSubmit={handleSendOtp} className="space-y-6">
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
                            Send OTP
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
                    )}

                    {resetStep === "otp" && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300 text-center">Verification Code</label>
                          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                            {[...Array(6)].map((_, idx) => (
                              <input
                                key={idx}
                                ref={(el) => (otpInputsRef.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={otp[idx] || ''}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-semibold rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                              />
                            ))}
                          </div>
                          <p className="text-center text-xs text-gray-500 mt-2">Enter the 6-digit code sent to your email</p>
                        </div>

                        <div className="space-y-3">
                          <Button type="button" size="lg" fullWidth onClick={verifyOtp} loading={loading}>
                            Verify OTP
                          </Button>
                          <div className="flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => setResetStep("email")}
                              className="text-sm text-indigo-400 hover:text-indigo-300"
                            >
                              ← Change email
                            </button>
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={resendTimer > 0}
                              className={`text-sm ${resendTimer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
                            >
                              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {resetStep === "password" && (
                      <form onSubmit={(e) => { e.preventDefault(); updatePassword(); }} className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="••••••••"
                          />
                          {formData.password && (
                            <div className="mt-3">
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div key={level} className={`h-1 flex-1 rounded-full ${level <= passwordStrength ? strengthInfo.bg : 'bg-white/10'}`} />
                                ))}
                              </div>
                              <p className={`text-xs ${strengthInfo.color}`}>{strengthInfo.text} password</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button type="submit" size="lg" fullWidth loading={loading}>
                            Update Password
                          </Button>
                          <button
                            type="button"
                            onClick={() => setResetStep("otp")}
                            className="w-full text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            ← Back to OTP
                          </button>
                        </div>
                      </form>
                    )}

                    {resetStep === "success" && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white">Password Updated Successfully</h3>
                        <p className="text-gray-400">You can now log in with your new password.</p>
                        <Button type="button" size="lg" fullWidth onClick={handleBackToLogin}>
                          Back to Login
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Normal Login / Register Form (unchanged) */}
                {!showResetPassword && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name (Register) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name <span className="text-red-400">*</span></label>
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
                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${errors.name ? 'border-red-500/50' : 'border-white/10'}`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address <span className="text-red-400">*</span></label>
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
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${errors.email ? 'border-red-500/50' : 'border-white/10'}`}
                          placeholder="john@company.com"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password <span className="text-red-400">*</span></label>
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
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${errors.password || errors.passwordStrength ? 'border-red-500/50' : 'border-white/10'}`}
                          placeholder="••••••••"
                        />
                      </div>
                      {!isLogin && formData.password && (
                        <div className="mt-3">
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div key={level} className={`h-1 flex-1 rounded-full ${level <= passwordStrength ? strengthInfo.bg : 'bg-white/10'}`} />
                            ))}
                          </div>
                          <p className={`text-xs ${strengthInfo.color}`}>{strengthInfo.text} password</p>
                        </div>
                      )}
                      {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                      {errors.passwordStrength && <p className="mt-1 text-xs text-red-400">{errors.passwordStrength}</p>}
                    </div>

                    {/* Confirm Password (Register) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password <span className="text-red-400">*</span></label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} text-white`}
                          placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
                      </div>
                    )}

                    {/* Access Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Access Key (Optional)</label>
                      <input
                        type="text"
                        name="accessKey"
                        value={formData.accessKey}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                        placeholder="Enter special access key"
                      />
                    </div>

                    {/* Role selection (Register) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Select Role</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, role: 'Freelancer' }))}
                            className={`flex-1 py-2 rounded-lg ${formData.role === 'Freelancer' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'}`}
                          >
                            Freelancer
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, role: 'Client' }))}
                            className={`flex-1 py-2 rounded-lg ${formData.role === 'Client' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'}`}
                          >
                            Client
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Remember me & Forgot password (Login) */}
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
                          onClick={() => {
                            setShowResetPassword(true);
                            setResetStep("email");
                            setOtp('');
                          }}
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

                {/* Social Login (unchanged) */}
                {!showResetPassword && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <button
                      onClick={() => window.location.href = "http://localhost:5000/api/auth/google"}
                      className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                    >
                      <FaGoogle className="text-xl text-red-400" />
                    </button>
                    <button className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all">
                      <FaGithub className="text-xl text-white" />
                    </button>
                    <button className="flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                      <FaXTwitter className="text-xl text-blue-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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