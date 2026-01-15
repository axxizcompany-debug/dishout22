
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SizzleLoader from './components/SizzleLoader';
import AuthForm from './components/AuthForm';
import DeliverySelector from './components/DeliverySelector';
import { AIService } from './services/aiService';
import { apiService } from './services/apiService';
import { AppState, DishAnalysisResult, LocationData } from './types';
import { COLORS } from './constants';
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
  
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{phone: string, title: string} | null>(null);
  
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiServiceRef = useRef(new AIService(process.env.API_KEY || ''));

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
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAppState(AppState.ANALYZING);
    setUploadedImageUrl(null);

    try {
      const base64Jpeg = await convertToJpeg(file);
      setImagePreview(base64Jpeg);
      
      apiService.uploadDishImage(base64Jpeg)
        .then(url => setUploadedImageUrl(url))
        .catch(err => console.error("Background image upload failed", err));

      processImage(base64Jpeg);
    } catch (err) {
      console.error("Image processing error:", err);
      setErrorMsg("Unable to process image.");
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
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { timeout: 10000 }
      );
    });
  };

  const processImage = async (base64Full: string) => {
    try {
      let locData: LocationData | undefined = undefined;
      try {
        locData = await getLocation();
        setLocation(locData);
      } catch (e) {
        console.warn("Proceeding without location", e);
      }

      const mimeType = 'image/jpeg';
      const base64Data = base64Full.split(',')[1];
      
      const result = await aiServiceRef.current.identifyDishAndFindPlaces(
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
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string | undefined, title: string | undefined) => {
    e.preventDefault();
    if (!phone) {
      alert("No official contact number found for this restaurant.");
      return;
    }
    setPendingOrder({ phone, title: title || 'Unknown Restaurant' });
    setShowDeliveryModal(true);
  };

  const handleDeliverySelection = (provider: string) => {
    if (!pendingOrder) return;
    const cleanPhone = pendingOrder.phone.replace(/\D/g, '');
    const dishName = analysisResult?.dishName || "Unknown Dish";
    let message = `Hello, I found ${pendingOrder.title} on DishOut. I'd like to order ${dishName} via ${provider}.`;
    if (uploadedImageUrl) message += ` Dish Reference: ${uploadedImageUrl}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    apiService.trackLead({
      dishName,
      restaurantName: pendingOrder.title,
      restaurantPhone: cleanPhone,
      userEmail: currentUser?.email,
      timestamp: new Date().toISOString(),
      dishImageUrl: uploadedImageUrl
    });

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
                Snap a photo. DishOut identifies the meal and finds the best local spots serving it.
              </p>
              
              <div 
                onClick={handleCapture}
                className="cursor-pointer group relative w-48 h-48 rounded-full flex items-center justify-center border-2 border-dashed border-[#FF4500] hover:bg-[#FF4500]/10 transition-all duration-300 shadow-[0_0_50px_rgba(255,69,0,0.1)] hover:shadow-[0_0_80px_rgba(255,69,0,0.2)]"
              >
                <div className="text-center space-y-2">
                  <svg className="w-10 h-10 text-[#FF4500] mx-auto group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                    {currentUser ? 'Capture Dish' : 'Sign In to Scan'}
                  </span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </motion.div>
          )}

          {appState === AppState.ANALYZING && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
              {imagePreview && (
                <div className="w-full h-64 rounded-3xl overflow-hidden mb-8 relative border border-white/10 shadow-2xl">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                </div>
              )}
              <SizzleLoader />
            </motion.div>
          )}

          {appState === AppState.RESULTS && analysisResult && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
              <div className="relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
                <h2 className="text-3xl font-bold text-white mb-2">{analysisResult.dishName}</h2>
                <p className="text-gray-300 leading-relaxed text-sm">{analysisResult.description}</p>
              </div>

              <h3 className="text-xl font-semibold text-[#FF4500] pl-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Nearby Gems
              </h3>
              
              <div className="space-y-4">
                {analysisResult.groundingChunks.length > 0 ? (
                  analysisResult.groundingChunks.map((chunk, idx) => {
                    const hasUri = !!chunk.maps?.uri;
                    const hasPhone = !!chunk.maps?.phoneNumber;
                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/5 hover:border-[#FF4500]/50 transition-colors duration-300"
                      >
                        <h4 className="font-bold text-lg text-white">{chunk.maps?.title || "Local Restaurant"}</h4>
                        {chunk.maps?.address && <p className="text-xs text-gray-500 mb-1">{chunk.maps.address}</p>}
                        {hasPhone && <p className="text-xs text-[#FF4500] mb-2 font-medium">{chunk.maps?.phoneNumber}</p>}
                        
                        <div className="mt-4 flex space-x-3">
                          {hasUri && (
                            <a href={chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-bold text-center hover:bg-white/20 transition-colors">
                              View Map
                            </a>
                          )}
                          <a 
                            href="#"
                            onClick={(e) => handleWhatsAppClick(e, chunk.maps?.phoneNumber, chunk.maps?.title)}
                            className={`flex-1 py-2 rounded-xl text-[#121212] text-xs font-bold text-center transition-all ${hasPhone ? 'bg-[#25D366] hover:brightness-110 shadow-[0_4px_15px_rgba(37,211,102,0.2)]' : 'bg-gray-600 opacity-50 cursor-not-allowed grayscale'}`}
                          >
                            WhatsApp Order
                          </a>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 italic text-center py-8">No specific local restaurants identified in the immediate area.</p>
                )}
              </div>

              <button onClick={resetApp} className="w-full py-4 mt-8 rounded-full bg-[#FF4500] font-bold text-white shadow-lg hover:scale-[1.02] transition-all">
                Scan Another Dish
              </button>
            </motion.div>
          )}

          {appState === AppState.ERROR && (
             <motion.div key="error" className="text-center mt-20 p-8 rounded-3xl bg-red-500/10 border border-red-500/20">
               <h3 className="text-xl font-bold text-red-500 mb-2">Service Error</h3>
               <p className="text-gray-400 mb-6">{errorMsg}</p>
               <button onClick={resetApp} className="px-6 py-2 rounded-full border border-gray-600 hover:bg-gray-800 transition-colors">Try Again</button>
             </motion.div>
          )}
        </AnimatePresence>

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
    <div className="min-h-screen text-gray-100 font-sans selection:bg-[#FF4500]">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderContent()}
    </div>
  );
};

export default App;
