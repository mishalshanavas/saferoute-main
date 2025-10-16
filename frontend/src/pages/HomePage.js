import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SplitText from '../components/SplitText';
import Galaxy from '../components/Galaxy';
import PixelTrail from '../components/PixelTrail';
import CardNav from '../components/CardNav';
import logo from '../components/logo.svg';

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const containerRef = useRef(null);

  const navItems = [
    {
      label: "About",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Company", ariaLabel: "About Company" },
        { label: "Mission", ariaLabel: "About Mission" }
      ]
    },
    {
      label: "Routes", 
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Dashboard", ariaLabel: "Route Dashboard", href: "/dashboard" },
        { label: "History", ariaLabel: "Route History", href: "/route-history" }
      ]
    },
    {
      label: "Contact",
      bgColor: "#271E37", 
      textColor: "#fff",
      links: [
        { label: "Support", ariaLabel: "Contact Support" },
        { label: "Feedback", ariaLabel: "Send Feedback" }
      ]
    }
  ];

  return (
    <div className="bg-black text-white overflow-hidden relative">
      {/* Navigation */}
      <CardNav
        logo={logo}
        logoAlt="SafeRoute Logo"
        items={navItems}
        baseColor="rgba(255, 255, 255, 0.1)"
        menuColor="#fff"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />

      {/* Background Galaxy Effect */}
      <div className="fixed inset-0 z-0">
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
        />
      </div>

      {/* Pixel Trail Effect */}
      <PixelTrail />
      
      <div className="min-h-screen relative z-10" ref={containerRef}>
        <main className="pt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-16">
              {/* Main Title with Advanced Animation */}
              <div className="mb-8">
                <SplitText
                  text="SafeRoute"
                  className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight"
                  splitType="chars"
                  animation={{
                    from: { 
                      opacity: 0, 
                      y: 100, 
                      rotationX: -90,
                      scale: 0.5
                    },
                    to: { 
                      opacity: 1, 
                      y: 0, 
                      rotationX: 0,
                      scale: 1,
                      duration: 1.2,
                      ease: "power4.out",
                      stagger: 0.1
                    }
                  }}
                  gradient={{
                    colors: ['#ffffff', '#a3a3a3', '#ffffff'],
                    angle: 45
                  }}
                />
              </div>

              {/* Subtitle */}
              <div className="mb-12">
                <SplitText
                  text="Navigate Safely. Arrive Securely."
                  className="text-xl md:text-2xl font-light tracking-wide text-gray-300"
                  splitType="words"
                  animation={{
                    from: { opacity: 0, y: 50 },
                    to: { 
                      opacity: 1, 
                      y: 0, 
                      duration: 0.8,
                      ease: "power3.out",
                      stagger: 0.1,
                      delay: 1.5
                    }
                  }}
                />
              </div>

              {/* CTA Button */}
              <div className="mt-16">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="inline-block px-12 py-4 text-lg font-medium bg-white text-black 
                           hover:bg-gray-100 transition-all duration-300 
                           transform hover:scale-105 hover:shadow-2xl
                           border border-white/20 backdrop-blur-sm
                           animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: '2.5s',
                    animationFillMode: 'forwards'
                  }}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
