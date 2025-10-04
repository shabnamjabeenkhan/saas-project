import { useState, useRef, useEffect } from 'react';
import { cn } from '~/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholder?: string;
  sizes?: string;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  placeholder = "data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23f3f4f6'/%3E%3C/svg%3E",
  sizes = "100vw",
  quality = 85,
  ...props
}: OptimizedImageProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Don't observe if priority loading
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div className={cn("relative overflow-hidden", className)} ref={imgRef}>
      {/* Placeholder */}
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className={cn("absolute inset-0 w-full h-full object-cover blur-sm", className)}
          aria-hidden="true"
        />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          {...props}
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}

// Specialized component for logos
export function OptimizedLogo({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'priority' | 'placeholder'> & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      className={className}
      priority={true} // Logos should load immediately
      placeholder="data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' fill='%23e5e7eb' rx='4'/%3E%3C/svg%3E"
    />
  );
}