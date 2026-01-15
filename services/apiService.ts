
export interface LeadData {
  dishName: string;
  restaurantName: string;
  restaurantPhone: string;
  userEmail?: string | null;
  timestamp: string;
  dishImageUrl?: string | null;
}

export const apiService = {
  uploadDishImage: async (base64Data: string): Promise<string> => {
    try {
      const response = await fetch('/api/upload-dish-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) {
        console.warn("Image upload failed, proceeding without shareable link.");
        return "";
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading dish image:", error);
      return "";
    }
  },

  trackLead: async (leadData: LeadData): Promise<void> => {
    try {
      // Fire and forget - don't block UI
      fetch('/api/track-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      }).catch(e => console.error("Background lead tracking failed", e));
    } catch (e) {
      console.error("Failed to initiate lead tracking", e);
    }
  }
};
