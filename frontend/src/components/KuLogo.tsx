import React from 'react';
import kuLogoImg from '../assets/ku-logo.png';

interface KuLogoProps {
  className?: string;
  size?: number;
  width?: number;
  height?: number;
}

export const KuLogo: React.FC<KuLogoProps> = ({
  className = '',
  size = 48,
  width,
  height,
}) => {
  const targetHeight = height || size;
  const targetWidth = width || Math.round(targetHeight * (241 / 285));

  return (
    <img
      src={kuLogoImg}
      alt="มหาวิทยาลัยเกษตรศาสตร์ Kasetsart University"
      width={targetWidth}
      height={targetHeight}
      className={`object-contain flex-shrink-0 select-none ${className}`}
      style={{
        height: `${targetHeight}px`,
        width: `${targetWidth}px`,
        maxHeight: `${targetHeight}px`,
      }}
      loading="eager"
    />
  );
};
