import React from 'react';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { currentUser, logout } = useAuth();
  
  const navItems = [
    { id: 'home', label: 'DishOut' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'terms', label: 'Terms' }
  ];

  const handleAuthAction = async () => {
    if (currentUser) {
      try {
        await logout();
        setCurrentPage('home');
      } catch (error) {
        console.error("Failed to log out", error);
      }
    } else {
      setCurrentPage('auth');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div 
        className="max-w-4xl mx-auto rounded-2xl px-6 py-3 flex justify-between items-center"
        style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.glassBorder}`
        }}
      >
        <button 
          onClick={() => setCurrentPage('home')}
          className="text-2xl font-bold tracking-tighter"
        >
          <span className="text-white">Dish</span>
          <span style={{ color: COLORS.vibrantPersimmon }}>Out</span>
        </button>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6">
            {navItems.slice(1).map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.id ? 'text-[#FF4500]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block"></div>

          <button
            onClick={handleAuthAction}
            className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-all ${
              currentUser 
                ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                : 'bg-[#FF4500] text-white hover:bg-[#CC3700] shadow-lg shadow-orange-900/20'
            }`}
          >
            {currentUser ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;