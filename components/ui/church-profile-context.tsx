import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChurchProfileContextType {
  image: string | null;
  setImage: (img: string | null) => void;
  refreshImage: () => Promise<void>;
}

const ChurchProfileContext = createContext<ChurchProfileContextType | undefined>(undefined);

export function ChurchProfileProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<string | null>(null);

  const refreshImage = async () => {
    try {
      // Force cache bust
      const res = await fetch(`/api/church/avatar?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const imagePath = data.image;
        console.log('🔍 API returned path:', imagePath); // Debug log
        
        // Converte path para usar a nova API route se necessário
        const convertedPath = imagePath && !imagePath.startsWith('/api/assets') 
          ? `/api/assets${imagePath}` 
          : imagePath;
        
        console.log('🔍 Converted path:', convertedPath); // Debug log
        setImage(convertedPath);
      } else {
        console.error('Failed to fetch church avatar:', res.status);
        setImage(null);
      }
    } catch (error) {
      console.error('Error fetching church avatar:', error);
      setImage(null);
    }
  };

  useEffect(() => {
    refreshImage();
  }, []);

  return (
    <ChurchProfileContext.Provider value={{ image, setImage, refreshImage }}>
      {children}
    </ChurchProfileContext.Provider>
  );
}

export function useChurchProfile() {
  const ctx = useContext(ChurchProfileContext);
  if (!ctx) throw new Error('useChurchProfile must be used within ChurchProfileProvider');
  return ctx;
} 