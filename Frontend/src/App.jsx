import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext.jsx";

import { ToastProvider } from "./components/common/Toast";
import { SocketProvider } from "./socket/context/SocketContext";

import Layout from "./components/layout/Layout";
import PageTransition from "./components/layout/PageTransition";
import ProtectedRoute from "./components/ProtectedRoute";

import ChatModal from "./components/chat/Chatmood";
import ChatNotifications from "./components/chat/ChatNotifications";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import TeamMemberProfile from "./pages/TeamMemberProfile";
import Terms from './pages/Terms';
import ScrollToTop from "./ScrollToTop";
import Privacy from './pages/Privacy';
import Cookie from './pages/Cookie';
import HelpCenter from './pages/HelpCenter';
import Notifications from './pages/Notifications';

// NEW: Import the three project detail pages
import ProjectDetail from "./pages/ProjectDetail";

// Animated Routes
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <PageTransition>
      <Routes location={location} key={location.pathname}>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookie" element={<Cookie />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/notifications" element={<Notifications />} />

        
        {/* Project Detail Page */}
        <Route path="/projects/:slug" element={<ProjectDetail />} />

        {/* Existing dynamic project route */}
        <Route path="/projects/:id" element={<ProjectDetails />} />

        <Route path="/team/:id" element={<TeamMemberProfile />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Auth Page */}
        <Route path="/auth" element={<Auth />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </PageTransition>
  );
}

function App() {
  // 💬 Chat modal state
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <BrowserRouter>
    
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <NotificationProvider>
                {/* Chat Notifications */}
                <ChatNotifications />

                {/* Main Layout */}
                <Layout openChat={() => setChatOpen(true)}>
                  <AnimatedRoutes />
                </Layout>

                {/* Floating Chat Modal */}
                {chatOpen && (
                  <ChatModal onClose={() => setChatOpen(false)} />
                )}
                </NotificationProvider>
              </SocketProvider>
            
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;