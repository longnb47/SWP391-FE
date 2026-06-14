import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const OAuth2RedirectHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const email = params.get('email');

    if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      if (email) {
        localStorage.setItem('userEmail', email);
      }
      
      // Clean query parameters from URL and redirect to dashboard
      navigate('/dashboard', { replace: true });
    } else {
      console.error('Google OAuth2 callback missing token or refreshToken.');
      alert('Authentication failed: Missing credentials from Google login.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center select-none font-body-md">
      <div className="space-y-4 animate-pulse">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <div>
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Signing in with Google</h2>
          <p className="text-secondary text-sm mt-1">Please wait while we set up your secure session...</p>
        </div>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;
