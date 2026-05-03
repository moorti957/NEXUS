import React, { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  saveOnboardingStep,
  completeOnboarding,
  uploadProfilePhoto,
} from '../../services/api'; // adjust path to your api.js

// -----------------------------------------------------------------------------
// Toast Notification System (same as before)
// -----------------------------------------------------------------------------
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => onRemove(toast.id), 3000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/40 border-green-700/50 text-green-200';
      case 'error':
        return 'bg-red-900/40 border-red-700/50 text-red-200';
      default:
        return 'bg-blue-900/40 border-blue-700/50 text-blue-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 animate-slide-in-right ${getToastStyles(toast.type)}`}
        >
          {toast.type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Tag Input Component (unchanged)
// -----------------------------------------------------------------------------
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  label: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onAdd, onRemove, placeholder, label }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-gray-200 text-sm border border-white/20"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="hover:text-white ml-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Onboarding Wizard Component
// -----------------------------------------------------------------------------
interface OnboardingWizardProps {
  onComplete?: (data: any) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
  const [initialized, setInitialized] = useState(false);

  const [formData, setFormData] = useState({
    profilePhoto: null as string | null,
    firstName: '',
    lastName: '',
    username: '',
    mobileNumber: '',
    email: '',
    city: '',
    country: '',
    accountType: 'Freelancer',
    skills: [] as string[],
    experienceLevel: 'Beginner',
    instagram: '',
    facebook: '',
    linkedin: '',
    portfolio: '',
    shortBio: '',
    about: '',
    languages: [] as string[],
    notifications: true,
    privacySettings: 'public',
    terms: false,
  });

  // Toast helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load user profile from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { user, profile } = await getUserProfile();
        // Split name into firstName/lastName
        const nameParts = user.name?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData((prev) => ({
          ...prev,
          firstName,
          lastName,
          email: user.email,
          // Pre-fill from existing profile if any
          ...(profile && {
            username: profile.username || '',
            mobileNumber: profile.mobileNumber || '',
            city: profile.city || '',
            country: profile.country || '',
            accountType: profile.accountType || 'Freelancer',
            skills: profile.skills || [],
            experienceLevel: profile.experienceLevel || 'Beginner',
            instagram: profile.socialLinks?.instagram || '',
            facebook: profile.socialLinks?.facebook || '',
            linkedin: profile.socialLinks?.linkedin || '',
            portfolio: profile.socialLinks?.portfolio || '',
            shortBio: profile.shortBio || '',
            about: profile.about || '',
            languages: profile.languages || [],
            notifications: profile.preferences?.notifications ?? true,
            privacySettings: profile.preferences?.privacySettings || 'public',
            profilePhoto: profile.profilePhoto || null,
          }),
        }));
        setInitialized(true);
     } catch (err: any) {
  showToast(err.message || 'Failed to load profile', 'error');
} finally {
  setInitialized(true); // 🔥 MUST ADD
}
    };
    loadProfile();
  }, []);

  // Draft save/load (localStorage)
  const saveDraft = useCallback(() => {
    const draft = { formData, currentStep, savedAt: new Date().toISOString() };
    localStorage.setItem('onboarding_draft', JSON.stringify(draft));
    showToast('Draft saved locally', 'success');
  }, [formData, currentStep]);

  const loadDraft = useCallback(() => {
    const saved = localStorage.getItem('onboarding_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData(draft.formData);
        setCurrentStep(draft.currentStep);
        showToast('Draft loaded', 'info');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const hasDraft = localStorage.getItem('onboarding_draft');
    if (hasDraft && window.confirm('You have a saved draft. Continue?')) {
      loadDraft();
    }
  }, [loadDraft]);

  const clearDraft = () => localStorage.removeItem('onboarding_draft');

  // Validation (unchanged)
  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.username.trim()) errors.username = 'Username is required';
        if (formData.username.length < 3) errors.username = 'Username must be at least 3 characters';
        break;
      case 2:
        if (!formData.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.country.trim()) errors.country = 'Country is required';
        break;
      case 3:
        if (!formData.accountType) errors.accountType = 'Account type is required';
        if (formData.skills.length === 0) errors.skills = 'At least one skill is required';
        if (!formData.experienceLevel) errors.experienceLevel = 'Experience level is required';
        break;
      case 5:
        if (!formData.shortBio.trim()) errors.shortBio = 'Short bio is required';
        if (formData.shortBio.length < 10) errors.shortBio = 'Short bio must be at least 10 characters';
        if (!formData.about.trim()) errors.about = 'About yourself is required';
        if (formData.about.length < 20) errors.about = 'About must be at least 20 characters';
        if (formData.languages.length === 0) errors.languages = 'At least one language is required';
        break;
      case 6:
        if (!formData.terms) errors.terms = 'You must accept the terms to continue';
        break;
      default:
        break;
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next with API save
 const handleNext = async () => {
  if (validateStep(currentStep)) {
    try {
      const { profilePhoto, ...safeData } = formData;

      await saveOnboardingStep({
        firstName: safeData.firstName,
        lastName: safeData.lastName,
        username: safeData.username,
        mobileNumber: safeData.mobileNumber,
        city: safeData.city,
        country: safeData.country,
        accountType: safeData.accountType,
        skills: [...safeData.skills],
        experienceLevel: safeData.experienceLevel,
        shortBio: safeData.shortBio,
        about: safeData.about,
        languages: [...safeData.languages],

        // ✅ correct structure
        socialLinks: {
          instagram: safeData.instagram,
          facebook: safeData.facebook,
          linkedin: safeData.linkedin,
          portfolio: safeData.portfolio,
        },

        preferences: {
          notifications: safeData.notifications,
          privacySettings: safeData.privacySettings,
        }
      });

      showToast('Progress saved', 'success');

    } catch (err) {
      console.error(err); // 👈 add this (debug)
      showToast('Failed to save progress', 'error');
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    showToast('Please fix the errors before continuing', 'error');
  }
};

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submit
  const handleSubmit = async () => {
    if (!validateStep(6)) {
      showToast('Please accept the terms to finish', 'error');
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding(formData);
      showToast('Onboarding completed successfully!', 'success');
      clearDraft();
      if (onComplete) onComplete(formData);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (stepErrors[name]) setStepErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle profile photo upload with real API
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
      console.log("🔥 FILE SELECTED:", file);
    if (!file) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profilePhoto: reader.result as string }));
    };
    reader.readAsDataURL(file);
    // Upload to server
    try {
      const photoUrl = await uploadProfilePhoto(file);
      setFormData((prev) => ({ ...prev, profilePhoto: photoUrl }));
      showToast('Photo uploaded', 'success');
    } catch (err: any) {
      showToast(err.message || 'Photo upload failed', 'error');
    }
  };

  const progress = (currentStep / 6) * 100;

  // Render step (identical to your existing renderStep, but using the handlers above)
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <p className="text-sm text-gray-400">Upload profile photo</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.firstName ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
                />
                {stepErrors.firstName && <p className="text-red-400 text-xs mt-1">{stepErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.lastName ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
                />
                {stepErrors.lastName && <p className="text-red-400 text-xs mt-1">{stepErrors.lastName}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.username ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
              />
              {stepErrors.username && <p className="text-red-400 text-xs mt-1">{stepErrors.username}</p>}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mobile Number *</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.mobileNumber ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
              />
              {stepErrors.mobileNumber && <p className="text-red-400 text-xs mt-1">{stepErrors.mobileNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.city ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
                />
                {stepErrors.city && <p className="text-red-400 text-xs mt-1">{stepErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.country ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
                />
                {stepErrors.country && <p className="text-red-400 text-xs mt-1">{stepErrors.country}</p>}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Account Type *</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="Freelancer">Freelancer</option>
                <option value="Viewer">Viewer</option>
                <option value="Client">Client</option>
              </select>
              {stepErrors.accountType && <p className="text-red-400 text-xs mt-1">{stepErrors.accountType}</p>}
            </div>
            <TagInput
              tags={formData.skills}
              onAdd={(tag) => setFormData((prev) => ({ ...prev, skills: [...prev.skills, tag] }))}
              onRemove={(tag) => setFormData((prev) => ({ ...prev, skills: prev.skills.filter((t) => t !== tag) }))}
              placeholder="e.g., React, UI Design, Marketing"
              label="Skills *"
            />
            {stepErrors.skills && <p className="text-red-400 text-xs mt-1">{stepErrors.skills}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Experience Level *</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
              {stepErrors.experienceLevel && <p className="text-red-400 text-xs mt-1">{stepErrors.experienceLevel}</p>}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instagram</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder="https://instagram.com/@username"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Facebook</label>
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Website</label>
              <input
                type="text"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleInputChange}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Short Bio *</label>
              <textarea
                name="shortBio"
                rows={3}
                value={formData.shortBio}
                onChange={handleInputChange}
                placeholder="A brief introduction (10-200 chars)"
                className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.shortBio ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
              />
              {stepErrors.shortBio && <p className="text-red-400 text-xs mt-1">{stepErrors.shortBio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">About Yourself *</label>
              <textarea
                name="about"
                rows={5}
                value={formData.about}
                onChange={handleInputChange}
                placeholder="Tell us more about your background, experience, and passions..."
                className={`w-full px-4 py-2 rounded-xl bg-white/5 border ${stepErrors.about ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-white/30`}
              />
              {stepErrors.about && <p className="text-red-400 text-xs mt-1">{stepErrors.about}</p>}
            </div>
            <TagInput
              tags={formData.languages}
              onAdd={(lang) => setFormData((prev) => ({ ...prev, languages: [...prev.languages, lang] }))}
              onRemove={(lang) => setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== lang) }))}
              placeholder="e.g., English, Spanish, French"
              label="Languages Known *"
            />
            {stepErrors.languages && <p className="text-red-400 text-xs mt-1">{stepErrors.languages}</p>}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h4 className="text-white font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-400">Receive updates about projects and messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/60"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Privacy Settings</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacySettings"
                    value="public"
                    checked={formData.privacySettings === 'public'}
                    onChange={handleInputChange}
                    className="text-white/60"
                  />
                  <span className="text-gray-300">Public Profile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacySettings"
                    value="private"
                    checked={formData.privacySettings === 'private'}
                    onChange={handleInputChange}
                    className="text-white/60"
                  />
                  <span className="text-gray-300">Private Profile</span>
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className="mt-1 text-white/60"
                />
                <div>
                  <span className="text-gray-300 text-sm">
                    I agree to the <button type="button" className="text-white/70 hover:underline">Terms of Service</button> and{' '}
                    <button type="button" className="text-white/70 hover:underline">Privacy Policy</button>
                  </span>
                  {stepErrors.terms && <p className="text-red-400 text-xs mt-1">{stepErrors.terms}</p>}
                </div>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 40px),
                           repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 40px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex justify-center items-center min-h-screen p-4 md:p-6">
        <div className="w-full max-w-3xl mx-auto mt-16">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step {currentStep} of 6</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 transition-all duration-300">
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Contact Details'}
              {currentStep === 3 && 'Professional Profile'}
              {currentStep === 4 && 'Social Links'}
              {currentStep === 5 && 'Bio & Description'}
              {currentStep === 6 && 'Preferences'}
            </h2>

            <div className="min-h-[400px]">{renderStep()}</div>

            {/* Navigation Buttons */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-8 pt-6 border-t border-white/10">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveDraft}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Draft
                </button>
              </div>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-2 rounded-xl bg-white text-black hover:bg-gray-200 font-medium transition-all shadow-lg"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2 rounded-xl bg-white text-black hover:bg-gray-200 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Finish 🎉'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;