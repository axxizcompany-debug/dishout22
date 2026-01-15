import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../constants';

type Region = 'UAE' | 'Saudi Arabia' | 'Kuwait' | 'Qatar' | 'Bahrain' | 'Oman' | 'USA' | 'Europe' | 'Asia';

const DELIVERY_PROVIDERS: Record<Region, string[]> = {
  'UAE': ['Talabat', 'Deliveroo', 'Noon Food', 'Careem', 'Zomato', 'Self Pickup'],
  'Saudi Arabia': ['HungerStation', 'Jahez', 'ToYou', 'Mrsool', 'Talabat', 'Self Pickup'],
  'Kuwait': ['Talabat', 'Deliveroo', 'Careem', 'Cari', 'Self Pickup'],
  'Qatar': ['Talabat', 'Snoonu', 'Deliveroo', 'Rafeeq', 'Self Pickup'],
  'Bahrain': ['Talabat', 'Ahlan', 'Jahez', 'Self Pickup'],
  'Oman': ['Talabat', 'TM DONE', 'Self Pickup'],
  'USA': ['DoorDash', 'Uber Eats', 'Grubhub', 'Postmates', 'Seamless', 'Caviar', 'Self Pickup'],
  'Europe': ['Just Eat', 'Deliveroo', 'Uber Eats', 'Wolt', 'Glovo', 'Bolt Food', 'Self Pickup'],
  'Asia': ['GrabFood', 'Foodpanda', 'GoFood', 'Swiggy', 'Zomato', 'Baemin', 'Self Pickup']
};

interface DeliverySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: string) => void;
  restaurantName: string;
}

const DeliverySelector: React.FC<DeliverySelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  restaurantName 
}) => {
  const [region, setRegion] = useState<Region>('UAE');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#1e1e1e] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl pointer-events-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-1">How do you want it?</h3>
                <p className="text-gray-400 text-sm">Ordering from <span className="text-[#FF4500]">{restaurantName}</span></p>
              </div>

              {/* Region Selector */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  Select Region
                </label>
                <div className="relative">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                    className="w-full appearance-none bg-black/30 border border-white/10 text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#FF4500] transition-colors"
                  >
                    {Object.keys(DELIVERY_PROVIDERS).map((r) => (
                      <option key={r} value={r} className="bg-[#1e1e1e]">{r}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Providers Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {DELIVERY_PROVIDERS[region].map((provider) => (
                  <button
                    key={provider}
                    onClick={() => onSelect(provider)}
                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-[#FF4500] hover:text-white border border-white/5 hover:border-[#FF4500] transition-all duration-200 text-sm font-medium text-gray-300"
                  >
                    {provider}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 text-sm text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeliverySelector;