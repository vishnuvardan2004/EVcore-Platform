
import React from 'react';
import { Camera } from 'lucide-react';

interface VehiclePhotosGridProps {
  photos: string[];
  title: string;
}

export const VehiclePhotosGrid: React.FC<VehiclePhotosGridProps> = ({ photos, title }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <Camera className="w-4 h-4" />
        {title} ({photos.length})
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`${title} ${index + 1}`}
            className="w-full h-20 object-cover rounded border"
          />
        ))}
      </div>
    </div>
  );
};
