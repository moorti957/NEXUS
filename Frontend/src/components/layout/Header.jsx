  import { Link, useNavigate } from 'react-router-dom';
  import { useState, useEffect, useRef } from 'react';
  import { useAuth } from '../../context/AuthContext';
  import { useTheme } from '../../context/ThemeContext';

  export default function Header({ openChat }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);
    const [chatNotifications, setChatNotifications] = useState([]);
    const BASE_URL = import.meta.env.VITE_API_URL;


   useEffect(() => {

  const handleChatToast = (event) => {

    const message = event.detail?.message;
    if (!message) return;

    const sender =
      typeof message.sender === "object"
        ? message.sender
        : {
            _id: message.sender,
            name: message.senderName || "User"
          };

    if (!sender?._id) return;

    setChatNotifications(prev => {

      const exists = prev.some(u => u._id === sender._id);

      if (exists) return prev;

      return [...prev, sender];

    });

  };

  window.addEventListener("chat:toast", handleChatToast);

  return () => {
    window.removeEventListener("chat:toast", handleChatToast);
  };

}, []);

const getInitials = (name) => {
  if (!name) return "U";

  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0,2);
};

    // Scroll effect for header background
    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAuthClick = () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      // When logged in, the avatar handles navigation; this is just fallback
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    };

    const handleLogout = () => {
      logout();
      navigate('/');
      setMobileMenuOpen(false);
      setDropdownOpen(false);
    };

    // Generate initials from user's name (e.g., "Dipanshu Sharma" → "DS")
    const getUserInitials = () => {
      if (!user?.name) return 'U';
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const navLinks = [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
      { name: 'Services', path: '/services' },
      { name: 'Blog', path: '/blog' },
      { name: 'Contact', path: '/contact' },
    ];

    return (
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? theme === 'dark'
              ? 'bg-black/90 backdrop-blur-xl border-b border-white/10'
              : 'bg-white/90 backdrop-blur-xl border-b border-gray-200'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
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
            <span className="text-xl font-bold font-display">NEXUS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link relative py-2 text-sm font-medium hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* User Avatar / Sign In Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform hover:scale-105"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img
  src={`${BASE_URL}${user.avatar}`}
  alt={user.name}
  className="w-full h-full rounded-full object-cover"
/>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      {getUserInitials()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-900/90 backdrop-blur-xl border border-white/10'
                        : 'bg-white/90 backdrop-blur-xl border border-gray-200'
                    }`}
                    style={{ transformOrigin: 'top right' }}
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-white/10'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>

                      <button
  type="button"
 onClick={() => {
  setDropdownOpen(false);
  setChatNotifications([]);
  openChat?.();
}}
  className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-sm transition-colors ${
    theme === 'dark'
      ? 'hover:bg-white/10'
      : 'hover:bg-gray-100'
  }`}
>

<div className="flex items-center gap-3">

<svg
  className="w-4 h-4"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
/>
</svg>

Chat

</div>


{/* Notification Avatars */}

{chatNotifications.length > 0 && (

<div className="flex items-center -space-x-2">

{chatNotifications.slice(0,3).map((u) => (

<div
key={u._id}
className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center border border-white"
>
{getInitials(u.name)}
</div>

))}

{chatNotifications.length > 3 && (

<div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center border border-white">

+{chatNotifications.length - 3}

</div>

)}

</div>

)}

</button>

                      {user.role === 'admin' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-white/10'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>
                      )}
                    </div>

                    <div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-400 transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-white/10'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="magnetic-btn px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ${
            mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          } ${
            theme === 'dark' ? 'bg-black/90' : 'bg-white/90'
          }`}
        >
          <nav className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-lg font-medium hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Logout Button (if logged in) */}
            {user && (
              <button
                onClick={handleLogout}
                className="py-3 text-lg font-medium text-red-400 hover:text-red-300 transition-colors text-left"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
    );
  }