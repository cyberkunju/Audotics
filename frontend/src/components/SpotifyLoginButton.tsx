import React from 'react';
import authService from '../services/auth.service';

const SpotifyLoginButton: React.FC = () => {
  const handleLogin = () => {
    authService.loginWithSpotify();
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
    >
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.53-1.07.29-3.29-2.02-7.43-2.47-12.31-1.35-.47.11-.95-.16-1.06-.63-.11-.47.16-.95.63-1.06 5.35-1.23 10.01-.68 13.7 1.69.35.22.48.74.26 1.11zm1.48-3.29c-.31.46-.88.65-1.34.34-3.76-2.31-9.48-2.98-13.91-1.63-.55.17-1.13-.14-1.29-.69-.17-.55.14-1.13.69-1.29 5.07-1.53 11.37-.77 15.73 1.93.46.28.65.87.34 1.34zm.13-3.43c-4.51-2.68-11.95-2.93-16.25-1.62-.66.2-1.35-.18-1.55-.83-.2-.65.18-1.35.83-1.55 4.95-1.51 13.19-1.22 18.38 1.86.61.36.81 1.16.45 1.77-.36.61-1.16.81-1.77.45l-.09-.08z" />
      </svg>
      Login with Spotify
    </button>
  );
};

export default SpotifyLoginButton; 