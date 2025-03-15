'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { FiUser, FiLock, FiArrowRight, FiMail } from 'react-icons/fi';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { clearAllAuthCookies } from '@/lib/spotify-auth/utils';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Refs for animation
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: {
        duration: 0.3
      }
    }
  };

  // Particle movement effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update card style with mousemove effect
      cardRef.current.style.setProperty("--mouse-x", `${x}px`);
      cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    };
    
    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);
  
  // Check if already authenticated and redirect if needed
  useEffect(() => {
    // Clear existing state to ensure fresh login
    clearAllAuthCookies();
    
    // Animated appearance
    const sequence = async () => {
      await controls.start({ opacity: 1 });
      setLoading(false);
    };
    
    sequence();
  }, [controls]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, we're just redirecting to the dashboard
    // In a real app, you would authenticate with a backend
    router.push('/dashboard');
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="music-wave"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className={`text-lg ${isDark ? 'text-white/70' : 'text-black/70'}`}>Preparing your experience...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
        
        {/* Animated orbs */}
        <div className="orbs-container">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        </div>
        
      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-md w-full"
        >
          {/* Logo */}
          <motion.div 
            variants={itemVariants} 
            className="text-center mb-10"
          >
            <Link href="/" className="inline-block">
              <div className="gradient-logo-container mx-auto">
                <svg 
                  className="w-24 h-24 mx-auto"
                  viewBox="0 0 11090.6 10947.8"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path d="M5625.15 1736.09c-811.37,1338.56 -1329.04,3779.72 -2194.61,4881.88 -62.43,79.49 -125.25,145.97 -183.77,225.37 -66.2,89.77 -116.6,115.85 -189.51,193.86l-511.54 485.68c-539.16,431.98 -1209.93,790.12 -1872.28,1043.51 -83.66,32.02 -533.14,166.57 -574.45,193.25 -142.25,91.85 -102.46,392.77 293.63,268.64 1216.7,-381.25 2632.58,-1177.51 3323.66,-2176.21 65.75,-94.96 109.95,-141.98 172.56,-236.37 504.74,-760.81 967.15,-2147.05 1278.97,-3019.87 131.29,-367.42 214.5,-510.88 348.35,-825.27 20.43,-48.01 41.67,-95.05 65.11,-139.83l74.54 -103.55c133.89,146.33 388.09,778.43 490.46,1016.98 514.92,1199.84 442.07,1834.23 1301.21,3174.76 212.74,331.97 471.96,563.54 704.58,804.89 590.13,612.31 2366.17,1634.7 2907.33,1501 109.98,-287.44 -91.25,-309.74 -330.59,-395.25 -986.07,-352.27 -2057.4,-942.89 -2693.61,-1730.96 -182.98,-226.61 -340.1,-429.35 -482.62,-693.34 -538.59,-997.43 -540.07,-1329.98 -897.03,-2299.12 -206.94,-561.79 -449.87,-1148.75 -722.99,-1682.47 -81.27,-158.78 -148.23,-433.34 -307.4,-487.58z" />
                    <path d="M5630.25 4391.75c-131.37,63.66 -150.71,339.8 -196.12,497.31 -150.2,520.85 -335.45,973.44 -564.87,1453.74 -159,332.79 -323.55,579.13 -510.58,844.81 -200.08,284.23 -389.53,469.79 -616.75,712.9 -118.44,126.75 -217.12,200.87 -364.39,326.23 -857.57,730.02 -2097.26,1287.49 -3184.34,1520.72 -273.41,58.68 -230.63,328.53 -36.31,346.02 103.66,9.31 444.76,-76.14 557.19,-105.63 1510.54,-396.12 3181.62,-1443.85 4040.12,-2711.65 278.43,-411.16 506.4,-845.02 695.64,-1324.41 52.66,-133.43 121.13,-367.42 180.41,-479.97 51.64,45.9 66.6,143.07 92.46,233.62l277.19 721.57c233.66,507.4 447.04,822.63 759.73,1235.22 769.97,1015.83 2396.93,2002.68 3627.53,2332.03 61.28,16.4 814.18,288.1 661.38,-119.47 -29.07,-77.56 -102.94,-90.86 -198.24,-113.73 -717.88,-172.44 -1324,-427.64 -1906.48,-754.08 -692.08,-387.84 -969.97,-645.42 -1496.83,-1136.87 -932.58,-869.98 -1368.41,-2077.44 -1696.21,-3291.27 -31.69,-117.35 -25.32,-152.46 -120.53,-187.09z" />
                    <path d="M3066.87 9839.71c78.68,-67.62 890.47,-453.32 1400.92,-906.91l867.71 -870.55c89.86,-109.05 143.31,-197.73 269.16,-315.3l379.11 460.66c474.53,617.2 1378.68,1313.57 2106.38,1652.4 -117.02,129.47 -965.76,473.93 -1100.97,519.52 -1285.81,433.41 -2659.17,239.42 -3804.87,-447.33l-117.44 -92.49zm2512.23 -2760c-166.21,76.9 -593.24,1333.58 -2589.43,2396.75 -108.59,57.83 -351.74,145.43 -432.71,206.25 -208.82,156.94 81.82,317.71 121.98,346.2 1445.03,1024.87 3262.95,1203.65 4917.89,498.89 266.89,-113.64 596.87,-287.32 816.53,-437.7 485.95,-332.67 -0.48,-433.53 -266.43,-592.97 -702.72,-421.23 -1237.34,-777.61 -1763.11,-1382.85 -54,-62.16 -97.72,-95.09 -147.39,-158.96 -50.79,-65.27 -89.26,-99.32 -141.86,-165.16 -138.81,-173.83 -440.08,-671.41 -515.47,-710.45z" />
                    <path d="M5655.39 540.12c324.69,251.42 1161.86,2028.67 1404.31,2602.81 294.11,696.55 560,1482.5 768.82,2221.08 37.56,132.89 58.31,309.25 185.25,338.65 204.34,47.38 231.23,-148.08 194.25,-304.99 -300.82,-1276.01 -1099.68,-3118.83 -1741.63,-4269.42l-576.74 -932.4c-51,-74.88 -154.13,-245.74 -281.64,-175.1 -256.61,142.1 -1272.2,2131.4 -1454.19,2563.72 -207.75,493.47 -1045.68,2524.25 -1074.84,2940.44 -9.76,139.44 182.17,525.23 412.17,-124.37 88.41,-249.67 153.79,-516.65 236.16,-761.27 173.13,-514.14 358.83,-981.68 556.95,-1463.89 319.1,-776.67 913.89,-1979.75 1371.13,-2635.26z" />
                    <path d="M3064.45 367.14c-250.15,102.21 -678.06,431.56 -852.97,581.91 -220.54,189.51 -542.84,501.87 -726.1,732.29 -1388.14,1745.55 -1735.49,4082.36 -744.77,6142.51 65.02,135.21 171.47,421.71 383.73,299.76 209.06,-120.13 -129.86,-543.23 -290.49,-980.63 -701.41,-1910.34 -164.94,-4081.39 1150.26,-5500.29 443.17,-478.12 685.97,-636.23 1229.33,-943.37 208.48,-117.84 128.78,-445.64 -148.99,-332.18z" />
                    <path d="M9891.63 7997.25c12.12,104.19 200.66,301.19 385.82,-58.1 738.27,-1432.43 826.71,-3118.07 235.13,-4691.01 -281.69,-748.97 -612.09,-1212.8 -1087.16,-1779.67 -125.85,-150.13 -1655.06,-1587.98 -1565.6,-860.1 14.69,119.47 427.12,309.8 612.37,458.03l569.89 504.05c542.21,527.1 1081.24,1457.94 1300,2252.26 357.44,1297.83 268.34,2427.78 -238.73,3661.92 -48.68,118.44 -225.77,391.92 -211.72,512.62z" />
                    <path d="M1663.38 6095.4c-40.82,-77.81 -36.95,-126.54 -45.35,-234.35 -33.36,-677.85 -34.12,-1090.46 145.78,-1726.49 275.02,-972.29 840.04,-1750.15 1609.32,-2330.4 89.52,-67.53 232.77,-115.9 210.14,-270.48 -62.03,-424.01 -783.59,279.31 -868.98,353.61 -690.66,601.4 -1171.8,1577.98 -1379.53,2533.05 -173.53,797.91 -84.18,1805.68 225.74,2558.15 93.15,226.22 171.62,578.05 467.12,532.03 174.01,-190.42 -52.24,-435.67 -144.7,-674.73 -88.86,-229.76 -173.95,-486.92 -219.54,-740.39z" />
                    <path d="M9013.13 7309.29c-0.94,170.8 183.19,224.01 290.64,117.59 247.7,-245.37 454.58,-1272.62 500.09,-1670.16 165.43,-1445.34 -441.81,-2916.81 -1470.05,-3887.68 -189.21,-178.67 -445.83,-442.5 -662.89,-371.92 -116.66,330.67 194.07,377.57 428.3,632.43 59.22,64.42 82.15,90.34 137.26,143.97 516.11,502.39 858.41,1106.51 1076.6,1862.64 252.84,876.27 221.2,1938.39 -156.03,2786.92 -36.17,81.4 -143.47,305.68 -143.92,386.21z" />
                    <path d="M1663.38 6095.4c-11.24,-110.11 -2.03,-145.31 -45.35,-234.35 8.4,107.81 4.53,156.54 45.35,234.35z" />
                  </g>
            </svg>
              </div>
            </Link>
          </motion.div>
          
          {/* Auth Card */}
          <motion.div 
            ref={cardRef}
            variants={itemVariants}
            className="card-container"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="card-content">
              {/* Tabs */}
              <div className="flex mb-6">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`auth-tab ${!isSignUp ? 'auth-tab-active' : ''}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`auth-tab ${isSignUp ? 'auth-tab-active' : ''}`}
                >
                  Sign Up
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {isSignUp ? (
                  // Sign Up Form
                  <motion.form 
                    key="signup"
                    onSubmit={handleSubmit} 
                    className="space-y-5"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={formVariants}
                  >
                    <div className="form-group">
                      <label className="input-label">Full Name</label>
                      <div className={`input-container ${activeField === 'name' ? 'input-active' : ''}`}>
                        <FiUser className="input-icon" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="input-field"
                          required
                          onFocus={() => setActiveField('name')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="input-label">Email Address</label>
                      <div className={`input-container ${activeField === 'email-signup' ? 'input-active' : ''}`}>
                        <FiMail className="input-icon" />
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          className="input-field"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          onFocus={() => setActiveField('email-signup')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="input-label">Password</label>
                      <div className={`input-container ${activeField === 'password-signup' ? 'input-active' : ''}`}>
                        <FiLock className="input-icon" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="input-field"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          onFocus={() => setActiveField('password-signup')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="input-label">Confirm Password</label>
                      <div className={`input-container ${activeField === 'confirm-password' ? 'input-active' : ''}`}>
                        <FiLock className="input-icon" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="input-field"
                          required
                          onFocus={() => setActiveField('confirm-password')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-footer">
                      <motion.button
                        type="submit"
                        className="auth-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10">Create Account</span>
                        <span className="btn-icon">
                          <FiArrowRight />
                        </span>
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  // Sign In Form
                  <motion.form 
                    key="signin"
                    onSubmit={handleSubmit} 
                    className="space-y-5"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={formVariants}
                  >
                    <div className="form-group">
                      <label className="input-label">Email Address</label>
                      <div className={`input-container ${activeField === 'email' ? 'input-active' : ''}`}>
                        <FiMail className="input-icon" />
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          className="input-field"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          onFocus={() => setActiveField('email')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="input-label">Password</label>
                      <div className={`input-container ${activeField === 'password' ? 'input-active' : ''}`}>
                        <FiLock className="input-icon" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="input-field"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          onFocus={() => setActiveField('password')}
                          onBlur={() => setActiveField(null)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Link href="/auth/recover" className="forgot-password">
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    
                    <div className="form-footer">
                      <motion.button
                        type="submit"
                        className="auth-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10">Sign In</span>
                        <span className="btn-icon">
                          <FiArrowRight />
                        </span>
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* App features */}
          <motion.div 
            variants={itemVariants} 
            className="mt-8 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex justify-center mb-4">
              <div className="feature-badge">
                <SparklesIcon className="h-5 w-5 spark-icon" />
                <span className="feature-text">
                  AI-Powered Music Recommendations
                </span>
              </div>
            </div>
            
            {/* Music Services Section */}
            <motion.div 
              variants={itemVariants} 
              className="mt-8 text-center"
            >
              <div className="music-services-heading">
                <span className="relative">
                  Connect with your favorite music platforms
                  <span className="coming-soon-badge">More Coming Soon</span>
                </span>
              </div>
              
              <div className="music-services-container">
                {/* Spotify - Active */}
                <div className="music-service-item active">
                  <Image 
                    src="/images/music-services/spotify.svg" 
                    alt="Spotify" 
                    width={40} 
                    height={40} 
                    className="music-service-icon" 
                  />
                  <span className="music-service-name">Spotify</span>
                </div>
                
                {/* Apple Music - Coming Soon */}
                <div className="music-service-item coming-soon">
                  <div className="coming-soon-overlay">
                    <span>Coming Soon</span>
                  </div>
                  <Image 
                    src="/images/music-services/apple-music.svg" 
                    alt="Apple Music" 
                    width={40} 
                    height={40} 
                    className="music-service-icon" 
                  />
                  <span className="music-service-name">Apple Music</span>
                </div>
                
                {/* YouTube Music - Coming Soon */}
                <div className="music-service-item coming-soon">
                  <div className="coming-soon-overlay">
                    <span>Coming Soon</span>
                  </div>
                  <Image 
                    src="/images/music-services/youtube-music.svg" 
                    alt="YouTube Music" 
                    width={40} 
                    height={40} 
                    className="music-service-icon" 
                  />
                  <span className="music-service-name">YouTube Music</span>
                </div>
                
                {/* Tidal - Coming Soon */}
                <div className="music-service-item coming-soon">
                  <div className="coming-soon-overlay">
                    <span>Coming Soon</span>
                  </div>
                  <Image 
                    src="/images/music-services/tidal.svg" 
                    alt="Tidal" 
                    width={40} 
                    height={40} 
                    className="music-service-icon" 
                  />
                  <span className="music-service-name">Tidal</span>
                </div>
                
                {/* Amazon Music - Coming Soon */}
                <div className="music-service-item coming-soon">
                  <div className="coming-soon-overlay">
                    <span>Coming Soon</span>
                  </div>
                  <Image 
                    src="/images/music-services/amazon-music.svg" 
                    alt="Amazon Music" 
                    width={40} 
                    height={40} 
                    className="music-service-icon" 
                  />
                  <span className="music-service-name">Amazon</span>
                </div>
              </div>
            </motion.div>
            
            <p className="terms-text">
              By signing in, you agree to our <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      <style jsx global>{`
        /* Animated waves */
        .music-wave {
          background: linear-gradient(45deg, #ff0080, #7928ca);
          height: 30px;
          width: 4px;
          border-radius: 15px;
          margin: 0 2px;
          animation: wave 1.2s linear infinite;
          transform-origin: bottom;
        }
        
        @keyframes wave {
          0% { transform: scaleY(0.1); }
          50% { transform: scaleY(1); }
          100% { transform: scaleY(0.1); }
        }
        
        /* Gradient animated logo */
        .gradient-logo-container {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gradient-logo-container svg {
          position: relative;
          z-index: 2;
          fill: url(#logo-gradient);
        }
        
        .gradient-logo-container::before {
          content: "";
          position: absolute;
          inset: -15px;
          background: radial-gradient(
            circle at center,
            rgba(255, 0, 128, 0.3) 0%,
            rgba(121, 40, 202, 0.2) 25%,
            rgba(79, 70, 229, 0.1) 50%,
            transparent 70%
          );
          border-radius: 50%;
          filter: blur(10px);
          opacity: 0.8;
          z-index: 1;
        }
        
        /* Spark icon animation */
        .spark-icon {
          opacity: 0.9;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
          animation: sparkle 2s linear infinite;
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.7; transform: scale(0.9) rotate(5deg); }
        }
        
        /* Floating orbs */
        .orbs-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          transition: all 3s ease;
        }
        
        .orb-1 {
          top: 20%;
          left: 20%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle at center, rgba(255, 0, 128, 0.7), rgba(121, 40, 202, 0.4) 70%);
          animation: float1 40s infinite alternate;
          box-shadow: 0 0 80px 20px rgba(255, 0, 128, 0.2);
        }
        
        .orb-2 {
          top: 60%;
          right: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(79, 70, 229, 0.7), rgba(14, 165, 233, 0.4) 70%);
          animation: float2 36s infinite alternate;
          box-shadow: 0 0 80px 20px rgba(79, 70, 229, 0.2);
        }
        
        .orb-3 {
          bottom: 10%;
          left: 30%;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle at center, rgba(121, 40, 202, 0.7), rgba(79, 70, 229, 0.4) 70%);
          animation: float3 42s infinite alternate;
          box-shadow: 0 0 80px 20px rgba(121, 40, 202, 0.2);
        }
        
        @keyframes float1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { filter: blur(70px); opacity: 0.25; }
          100% { transform: translate(70px, 30px) rotate(20deg); filter: blur(90px); opacity: 0.35; }
        }
        
        @keyframes float2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { filter: blur(70px); opacity: 0.25; }
          100% { transform: translate(-50px, -30px) rotate(-15deg); filter: blur(90px); opacity: 0.35; }
        }
        
        @keyframes float3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { filter: blur(70px); opacity: 0.25; }
          100% { transform: translate(40px, -50px) rotate(10deg); filter: blur(90px); opacity: 0.35; }
        }
        
        /* Card container and effects */
        .card-container {
          position: relative;
          border-radius: 24px;
          background: ${isDark ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.7)'};
          backdrop-filter: blur(20px);
          border: 1px solid ${isDark ? 'rgba(80, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.5)'};
          overflow: hidden;
          padding: 2px;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.1),
            0 1px 8px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transition: all 0.5s ease-out;
        }
        
        .card-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            1000px circle at var(--mouse-x) var(--mouse-y),
            rgba(255, 255, 255, 0.1),
            transparent 40%
          );
          z-index: 0;
          transition: all 0.3s ease;
        }
        
        .card-container::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(
            to right,
            rgba(255, 0, 128, 0.5),
            rgba(121, 40, 202, 0.5),
            rgba(79, 70, 229, 0.5)
          );
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        
        .card-container:hover::after {
          opacity: 0.8;
        }
        
        .card-content {
          position: relative;
          z-index: 1;
          padding: 32px;
          border-radius: 22px;
          height: 100%;
        }
        
        /* Tabs styling */
        .auth-tab {
          flex: 1;
          padding: 12px 0;
          text-align: center;
          font-weight: 500;
          transition: all 0.4s ease;
          border-radius: 16px;
          position: relative;
          z-index: 1;
          color: ${isDark ? 'rgba(209, 213, 219, 0.7)' : 'rgba(55, 65, 81, 0.7)'};
        }
        
        .auth-tab-active {
          color: white;
          background: linear-gradient(
            45deg,
            rgba(255, 0, 128, 1),
            rgba(121, 40, 202, 1),
            rgba(79, 70, 229, 1)
          );
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
          box-shadow: 0 5px 15px rgba(255, 0, 128, 0.4);
        }
        
        /* Form styling */
        .form-group {
          margin-bottom: 20px;
        }
        
        .input-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.9)'};
        }
        
        .input-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: ${isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
          border: 1px solid ${isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)'};
          transition: all 0.4s ease;
        }
        
        .input-active {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px ${isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)'};
          background: ${isDark ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
        }
        
        .input-icon {
          flex-shrink: 0;
          color: ${isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)'};
          font-size: 18px;
        }
        
        .input-field {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: ${isDark ? 'white' : 'black'};
        }
        
        .input-field::placeholder {
          color: ${isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)'};
        }
        
        .forgot-password {
          display: inline-block;
          margin-top: 6px;
          font-size: 13px;
          color: ${isDark ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)'};
          transition: color 0.3s ease;
        }
        
        .forgot-password:hover {
          color: ${isDark ? 'white' : '#4f46e5'};
          text-decoration: underline;
        }
        
        .form-footer {
          margin-top: 32px;
        }
        
        /* Button styling */
        .auth-button {
          width: 100%;
          padding: 14px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          gap: 8px;
          position: relative;
          color: white;
          background: linear-gradient(
            to right,
            #ff0080,
            #7928ca,
            #4f46e5
          );
          background-size: 200% auto;
          overflow: hidden;
          transition: all 0.5s ease;
          box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
        }
        
        .auth-button:hover {
          background-position: right center;
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.5);
        }
        
        .auth-button::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: 0.6s ease-in-out;
        }
        
        .auth-button:hover::before {
          left: 100%;
        }
        
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Feature badge */
        .feature-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 50px;
          background: ${isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
          border: 1px solid ${isDark ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)'};
          backdrop-filter: blur(5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          gap: 8px;
          transition: all 0.5s ease;
        }
        
        .feature-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .feature-text {
          font-size: 14px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.9)'};
        }
        
        /* Terms text */
        .terms-text {
          font-size: 13px;
          margin-top: 12px;
          color: ${isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)'};
        }
        
        .terms-link {
          color: ${isDark ? '#8b5cf6' : '#4f46e5'};
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .terms-link:hover {
          text-decoration: underline;
        }
        
        /* Music Services Section */
        .music-services-heading {
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.9)'};
          display: inline-block;
          position: relative;
        }
        
        .coming-soon-badge {
          position: absolute;
          top: -10px;
          right: -70px;
          background: linear-gradient(to right, #ff0080, #7928ca);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .music-services-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
          margin-bottom: 24px;
        }
        
        .music-service-item {
          width: 80px;
          height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 16px;
          background: ${isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
          border: 1px solid ${isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)'};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .music-service-item.active {
          border-color: rgba(79, 70, 229, 0.5);
          box-shadow: 0 0 15px rgba(79, 70, 229, 0.2);
        }
        
        .music-service-item.active:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
        }
        
        .music-service-item.coming-soon {
          opacity: 0.85;
          filter: grayscale(0.6);
        }
        
        .coming-soon-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${isDark ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .coming-soon-overlay span {
          font-size: 10px;
          font-weight: 600;
          color: ${isDark ? 'white' : '#4f46e5'};
          background: ${isDark ? 'rgba(55, 65, 81, 0.7)' : 'rgba(244, 244, 255, 0.9)'};
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid ${isDark ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)'};
        }
        
        .music-service-item.coming-soon:hover .coming-soon-overlay {
          opacity: 1;
        }
        
        .music-service-icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        
        .music-service-name {
          font-size: 11px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.8)' : 'rgba(55, 65, 81, 0.8)'};
          text-align: center;
        }
        
        /* Animation keyframes */
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0080" />
            <stop offset="50%" stopColor="#7928ca" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
} 