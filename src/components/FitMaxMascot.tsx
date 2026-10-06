import React from 'react';
import fitmaxMascotImg from '../assets/images/fitmax_mascot_1786609387411.jpg';

export type MascotPose = 'welcome' | 'workout' | 'thinking' | 'celebration' | 'caution' | 'empty';

interface FitMaxMascotProps {
  pose?: MascotPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  customImageUrl?: string;
  caption?: string;
}

export const FitMaxMascot: React.FC<FitMaxMascotProps> = ({
  pose = 'welcome',
  size = 'md',
  className = '',
  customImageUrl,
  caption
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-64 h-64'
  }[size];

  const imageUrl = customImageUrl || fitmaxMascotImg;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses} relative flex items-center justify-center rounded-2xl overflow-hidden bg-orange-50 border-2 border-orange-200/80 shadow-md transition-transform hover:scale-105`}>
        <img
          src={imageUrl}
          alt="کاراکتر رسمی فیت مکس (FIT MAX Character)"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
      {caption && (
        <span className="mt-2.5 text-xs font-bold text-orange-900 bg-orange-100/90 px-3.5 py-1.5 rounded-full text-center border border-orange-200 shadow-2xs">
          {caption}
        </span>
      )}
    </div>
  );
};

