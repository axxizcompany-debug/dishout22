import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="pt-32 pb-12 px-6 max-w-4xl mx-auto text-gray-300">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      
      <div className="space-y-8 p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">1. Acceptance</h2>
          <p>By using DishOut, you agree to these terms. Usage is limited to lawful culinary exploration.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">2. AI Accuracy</h2>
          <p>
            Dish identification is performed by AI (Gemini 2.5). Results may vary. Do not rely on DishOut for 
            allergen detection or medical dietary restrictions. We are not liable for incorrect dish identification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#FF4500] mb-4">3. WhatsApp Bridge</h2>
          <p>
            The "WhatsApp Bridge" creates a convenient link to chat with businesses. DishOut is not a party to 
            transactions made via WhatsApp.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;