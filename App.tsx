import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SizzleLoader from './components/SizzleLoader';
import AuthForm from './components/AuthForm';
import DeliverySelector from './components/DeliverySelector';
import { GeminiService } from './services/geminiService';
import { apiService } from './services/apiService';
import { AppState, DishAnalysisResult, LocationData } from './types';
import { COLORS, GEMINI_API_KEY } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DishAnalysisResult | null>(null);
  const [location, setLocation] = useState<LocationData | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Delivery Selection State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{phone: string, title: string} | null>(null);
  
  const { currentUser } = useAuth();
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Services
  const geminiService = useRef(new GeminiService(GEMINI_API_KEY));

  useEffect(() => {
    // Just-in-time check could go here, but we do it on action
  }, []);

  const handleCapture = () => {
    setErrorMsg(null);
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Helper to convert images (AVIF, WebP, PNG) to JPEG for API compatibility
  const convertToJpeg = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          // White background for transparency support
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(new Error('Failed to load image for conversion'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAppState(AppState.ANALYZING);
    setUploadedImageUrl(null); // Reset previous upload

    try {
      // Convert to JPEG to avoid "Unsupported MIME type: image/avif" errors
      const base64Jpeg = await convertToJpeg(file);
      setImagePreview(base64Jpeg);
      
      // Upload image for sharing in parallel with analysis
      apiService.uploadDishImage(base64Jpeg)
        .then(url => setUploadedImageUrl(url))
        .catch(err => console.error("Background image upload failed", err));

      processImage(base64Jpeg);
    } catch (err) {
      console.error("Image processing error:", err);
      setErrorMsg("Unable to process this image format. Please try a standard JPEG or PNG.");
      setAppState(AppState.ERROR);
    }
  };

  const getLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          console.warn("Location denied or failed", err);
          reject(err);
        }
      );
    });
  };

  const processImage = async (base64Full: string) => {
    try {
      // 1. Get Location (Just-in-Time)
      let locData: LocationData | undefined = undefined;
      try {
        locData = await getLocation();
        setLocation(locData);
      } catch (e) {
        console.log("Proceeding without location");
      }

      // 2. Call Gemini
      // Since we converted to JPEG in handleFileChange, we hardcode the mimeType
      const mimeType = 'image/jpeg';
      const base64Data = base64Full.split(',')[1];
      
      const result = await geminiService.current.identifyDishAndFindPlaces(
        base64Data,
        mimeType,
        locData
      );

      setAnalysisResult(result);
      setAppState(AppState.RESULTS);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setImagePreview(null);
    setAnalysisResult(null);
    setUploadedImageUrl(null);
  };

  const formatUAEPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('971')) {
      const rest = digits.slice(3);
      // Mobile (starts with 5): 9 digits after 971
      if (rest.startsWith('5')) return '971' + rest.slice(0, 9);
      // Dubai Landline (starts with 4): 8 digits after 971
      if (rest.startsWith('4')) return '971' + rest.slice(0, 8);
    }
    return digits;
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string | undefined, title: string | undefined) => {
    e.preventDefault();
    if (!phone) return;

    // Store pending order details and open modal
    setPendingOrder({ 
      phone, 
      title: title || 'Unknown Restaurant' 
    });
    setShowDeliveryModal(true);
  };

  const handleDeliverySelection = (provider: string) => {
    if (!pendingOrder) return;

    const cleanPhone = formatUAEPhone(pendingOrder.phone);
    const dishName = analysisResult?.dishName || "Unknown Dish";
    
    // Construct message with delivery provider
    let message = `Hello, I found ${pendingOrder.title} on DishOut, and I would like to order ${dishName}, I would like my delivery through ${provider}.`;
    
    if (uploadedImageUrl) {
      message += ` Here's the dish I'm looking for: ${uploadedImageUrl}`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Track Lead
    apiService.trackLead({
      dishName: dishName,
      restaurantName: pendingOrder.title,
      restaurantPhone: cleanPhone,
      userEmail: currentUser?.email,
      timestamp: new Date().toISOString(),
      dishImageUrl: uploadedImageUrl
    });

    // Open WhatsApp and close modal
    window.open(whatsappUrl, '_blank');
    setShowDeliveryModal(false);
    setPendingOrder(null);
  };

  const renderContent = () => {
    if (currentPage === 'privacy') return <Privacy />;
    if (currentPage === 'terms') return <Terms />;
    if (currentPage === 'auth') return <AuthForm onSuccess={() => setCurrentPage('home')} />;

    return (
      <main className="min-h-screen flex flex-col pt-24 px-4 pb-12 max-w-2xl mx-auto">
        
        <AnimatePresence mode="wait">
          
          {/* IDLE STATE */}
          {appState === AppState.IDLE && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center flex-1 space-y-8 text-center mt-12"
            >
              <h1 className="text-5xl font-bold leading-tight">
                What's on your <br />
                <span style={{ color: COLORS.vibrantPersimmon }}>Plate?</span>
              </h1>
              <p className="text-gray-400 max-w-md">
                Snap a photo. AI identifies the dish and finds the best spots serving it nearby.
              </p>
              
              <div 
                onClick={handleCapture}
                className="cursor-pointer group relative w-48 h-48 rounded-full flex items-center justify-center border-2 border-dashed border-[#FF4500] hover:bg-[#FF4500]/10 transition-all duration-300"
              >
                <div className="text-center space-y-2">
                  <svg className="w-10 h-10 text-[#FF4500] mx-auto group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                    {currentUser ? 'Capture Dish' : 'Log In to Scan'}
                  </span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </motion.div>
          )}

          {/* ANALYZING STATE */}
          {appState === AppState.ANALYZING && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full"
            >
              {imagePreview && (
                <div className="w-full h-64 rounded-3xl overflow-hidden mb-8 relative border border-white/10 shadow-2xl">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                </div>
              )}
              <SizzleLoader />
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {appState === AppState.RESULTS && analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Header */}
              <div className="relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-[#FF4500]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{analysisResult.dishName}</h2>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {analysisResult.description.split('\n')[0]} {/* Show first paragraph */}
                </p>
              </div>

              {/* Places */}
              <h3 className="text-xl font-semibold text-[#FF4500] pl-2">Nearby Gems</h3>
              
              <div className="space-y-4">
                {analysisResult.groundingChunks.length > 0 ? (
                   analysisResult.groundingChunks
                     .filter(chunk => chunk.maps)
                     .map((chunk, idx) => {
                      const rawPhone = chunk.maps?.phoneNumber;
                      const cleanPhone = rawPhone ? formatUAEPhone(rawPhone) : '';
                      const hasPhone = cleanPhone.length > 5; 

                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/5 hover:border-[#FF4500]/50 transition-colors duration-300 relative"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg text-white">{chunk.maps?.title}</h4>
                              {chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] && (
                                <p className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-700 pl-2">
                                  "{chunk.maps.placeAnswerSources[0].reviewSnippets[0].content}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-3">
                            <a 
                              href={chunk.maps?.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-4 rounded-xl bg-white/10 text-xs font-bold text-center hover:bg-white/20 transition-colors"
                            >
                              View Map
                            </a>
                            
                            {/* WhatsApp Bridge with Delivery Selector */}
                            <a 
                              href="#"
                              onClick={(e) => hasPhone ? handleWhatsAppClick(e, rawPhone, chunk.maps?.title) : e.preventDefault()}
                              className={`flex-1 py-2 px-4 rounded-xl text-[#121212] text-xs font-bold text-center transition-all flex items-center justify-center space-x-1 ${
                                hasPhone ? 'bg-[#25D366] hover:brightness-110' : 'bg-gray-600 cursor-not-allowed opacity-50'
                              }`}
                              title={hasPhone ? `Order from ${chunk.maps?.title}` : "Phone number not available"}
                            >
                              <span>{hasPhone ? 'WhatsApp Order' : 'No Phone'}</span>
                            </a>
                          </div>
                          {hasPhone && uploadedImageUrl && (
                            <div className="absolute -bottom-2 right-6 text-[10px] text-gray-500 bg-[#121212] px-2">
                              Includes dish photo link
                            </div>
                          )}
                        </motion.div>
                      );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-white/5 rounded-xl">
                    No location data found via Maps Grounding. 
                    <p className="text-xs mt-2">Try ensuring your location is enabled.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={resetApp}
                className="w-full py-4 mt-8 rounded-full bg-[#FF4500] font-bold text-white shadow-lg shadow-orange-900/50 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Scan Another Dish
              </button>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {appState === AppState.ERROR && (
             <motion.div
               key="error"
               className="text-center mt-20 p-8 rounded-3xl bg-red-500/10 border border-red-500/20"
             >
               <h3 className="text-xl font-bold text-red-500 mb-2">Kitchen Nightmare</h3>
               <p className="text-gray-400 mb-6">{errorMsg}</p>
               <button 
                 onClick={resetApp}
                 className="px-6 py-2 rounded-full border border-gray-600 hover:bg-gray-800 transition-colors"
               >
                 Try Again
               </button>
             </motion.div>
          )}

        </AnimatePresence>

        {/* Delivery Selector Modal */}
        <DeliverySelector 
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          onSelect={handleDeliverySelection}
          restaurantName={pendingOrder?.title || 'Unknown Restaurant'}
        />

      </main>
    );
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-[#FF4500] selection:text-white">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderContent()}
    </div>
  );
};

export default App;