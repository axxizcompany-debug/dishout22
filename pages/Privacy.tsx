import React from 'react';
import { COLORS } from '../constants';

const Privacy: React.FC = () => {
  return (
    <div className="pt-32 pb-12 px-6 max-w-4xl mx-auto text-gray-300">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <div className="space-y-8 p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">1. Data Collection & "Just-in-Time" Disclosure</h2>
          <p>
            DishOut adheres to strict 2026 data privacy standards. We only access your Camera and Geolocation 
            data at the specific moment of request ("Just-in-Time"). You will be explicitly prompted 
            by your browser/device to grant these permissions each session, or as configured by your device settings.
            We do not track your location in the background.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">2. Image Retention & Sharing</h2>
          <p>
            Images uploaded for analysis are processed by Gemini 2.5 Flash. To facilitate the "WhatsApp Order" feature, 
            a temporary, shareable link is generated for your dish photo.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-400">
            <li>These images are stored securely in Netlify Blobs.</li>
            <li>The shareable links included in WhatsApp messages <strong>expire automatically after 30 days</strong>.</li>
            <li>After expiration, the images are permanently deleted from our servers.</li>
          </ul>
          <p className="mt-4">
            You may request immediate deletion at any time via our Data Rights Request portal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">3. Third-Party Sharing & GDPR/CCPA</h2>
          <p>
            DishOut connects with Google Maps and WhatsApp. Location data is sent anonymously to Google Maps 
            solely to identify nearby restaurants. We do not sell your personal data.
          </p>
          <p className="mt-2">
            <strong>Opt-Out:</strong> By using this service, you consent to the processing of food imagery. 
            To opt-out of third-party menu data sharing, toggle the "Strict Privacy Mode" in your account settings 
            (Coming Soon).
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">4. Contact</h2>
          <p>For DPO inquiries: privacy@dishout.app</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;