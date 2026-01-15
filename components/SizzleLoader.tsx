import React from 'react';
import { motion } from 'framer-motion';

const SizzleLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-full">
      <div className="relative w-32 h-32">
        {/* Pan Base */}
        <div className="absolute bottom-0 w-full h-4 bg-gray-700 rounded-full opacity-50 blur-sm" />
        
        {/* Bubbles / Sizzle Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-4 left-1/2 w-4 h-4 rounded-full bg-[#FF4500]"
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.5 }}
            animate={{
              y: -80 - Math.random() * 50,
              x: (Math.random() - 0.5) * 60,
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.8],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              ease: "easeOut",
              delay: Math.random() * 0.5
            }}
          />
        ))}
        
        {/* Main "Dish" forming */}
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-orange-600/30 rounded-full blur-md"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>
      <motion.p 
        className="mt-6 text-xl font-light tracking-widest text-[#FF4500] uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Sizzling Data...
      </motion.p>
    </div>
  );
};

export default SizzleLoader;