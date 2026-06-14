import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const response = await authService.login(email.trim(), password);

    if (response.data && response.data.success) {
      const data = response.data.data;
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('userEmail', data.email);
      navigate('/dashboard');
    } else {
      setErrorMessage(response.error || 'Invalid email or password.');
    }
    setIsLoading(false);
  };

  // Shortcut for testing the frontend offline
  const handleDemoBypass = () => {
    localStorage.setItem('token', 'demo-bypass-token-12345');
    localStorage.setItem('userEmail', 'demo@example.com');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 font-body-md text-on-background select-none">
      {/* Centered Auth Card */}
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-lg p-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary items-center justify-center text-on-primary shadow-sm mb-2">
            <span className="material-symbols-outlined icon-fill select-none text-[28px]">cloud_sync</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black text-on-surface tracking-tight">
            AetherDocs
          </h1>
          <p className="font-body-md text-secondary select-none">
            Sign in to access your intelligent file storage
          </p>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="p-4 bg-error-container text-error rounded-xl border border-error/20 font-body-md text-sm animate-fade-in flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] select-none shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-label-md text-on-surface-variant text-xs font-semibold block">
              Email Address
            </label>
            <div className="relative focus-within:shadow-sm transition-shadow rounded-xl">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary select-none text-[20px]">
                mail
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 pl-10 pr-4 bg-surface-container-high focus:bg-surface border border-transparent focus:border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-on-surface-variant text-xs font-semibold block">
                Password
              </label>
              <a href="#" className="font-label-md text-primary text-xs hover:underline" onClick={() => alert('Forgot password is not implemented.')}>
                Forgot password?
              </a>
            </div>
            <div className="relative focus-within:shadow-sm transition-shadow rounded-xl">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary select-none text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 pl-10 pr-12 bg-surface-container-high focus:bg-surface border border-transparent focus:border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
              {/* Eye toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] select-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-6 font-semibold"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-outline-variant/40" />
          <span className="flex-shrink mx-4 text-secondary text-xs font-mono-label">OR</span>
          <div className="flex-grow border-t border-outline-variant/40" />
        </div>

        {/* Demo Bypass button for easy testing */}
        <button
          onClick={handleDemoBypass}
          className="w-full h-12 border border-primary text-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all shadow-sm cursor-pointer font-semibold"
        >
          <span className="material-symbols-outlined text-[20px] select-none">verified_user</span>
          Demo Login (Bypass API)
        </button>

        <p className="text-center font-body-md text-xs text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
