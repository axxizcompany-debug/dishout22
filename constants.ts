// In a real build, these come from process.env. 
// For this demo, we assume they are injected or the user will be prompted if missing.
export const GEMINI_API_KEY = process.env.API_KEY || '';
export const WHATSAPP_BUSINESS_TOKEN = process.env.WHATSAPP_TOKEN || '';

export const COLORS = {
  deepCharcoal: '#121212',
  darkOverlay: 'rgba(18, 18, 18, 0.8)',
  vibrantPersimmon: '#FF4500', // Sizzle Orange
  persimmonHover: '#CC3700',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBg: 'rgba(255, 255, 255, 0.05)',
};

export const PROMPTS = {
  IDENTIFY_DISH: `Identify this dish with a catchy title. Describe its key flavors. 
  Then, using your maps tool, find 3 highly-rated restaurants nearby that serve this specific dish or cuisine.
  For each restaurant, provide a reason why it is good and explicitly state its International Phone Number in the format "Phone: +xxxxxxxxxxx" if available.`
};