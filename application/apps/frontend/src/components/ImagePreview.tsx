import { memo, useState } from "react";

interface ImagePreviewProps {
  imageUrl: string;
  altText: string;
  size?: string;
}

export const ImagePreview = memo(
  ({ imageUrl, altText, size = "w-24 h-24" }: ImagePreviewProps) => {
    const [isImageError, setIsImageError] = useState(false);

    return (
      <div
        className={`relative ${size} bg-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex-shrink-0`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className={`w-full h-full object-cover ${size} ${isImageError ? "hidden" : ""}`}
            onError={() => setIsImageError(true)}
            onLoad={() => setIsImageError(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        {imageUrl && isImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-600 text-xs">
            Invalid URL
          </div>
        )}
      </div>
    );
  }
);
