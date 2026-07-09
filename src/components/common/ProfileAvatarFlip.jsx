import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { animateProfileAvatarFlip } from "../../animations/profileAnimations";

/**
 * Reusable 3D flip-in avatar used on profile pages and profile detail modals.
 * Pass a new `flipKey` when the avatar should replay the entrance animation.
 */
export default function ProfileAvatarFlip({
  src,
  initials = "",
  flipKey,
  hasImage = true,
  className = "h-20 w-20",
  initialsClassName = "text-2xl",
  borderClassName = "border-2 border-cyan-500/35 shadow-lg shadow-cyan-500/15",
  imageClassName = "",
  alt = "",
  onClick,
  clickable = false,
  onImageError,
  animateOnScroll = false,
  imageLoading = "eager",
}) {
  const stageRef = useRef(null);
  const spinnerRef = useRef(null);
  const frontRef = useRef(null);
  const imgRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [isInView, setIsInView] = useState(!animateOnScroll);
  const showImage = hasImage && !imageFailed;
  const [imageReady, setImageReady] = useState(!showImage);

  useEffect(() => {
    if (!animateOnScroll) {
      setIsInView(true);
      return undefined;
    }

    setIsInView(false);
    const el = stageRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animateOnScroll, flipKey]);

  useLayoutEffect(() => {
    setImageFailed(false);
  }, [flipKey, hasImage, src]);

  useLayoutEffect(() => {
    setImageReady(!showImage);
  }, [flipKey, showImage]);

  useLayoutEffect(() => {
    if (!showImage) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setImageReady(true);
    }
  }, [flipKey, showImage, src]);

  useGSAP(
    () => {
      if (!imageReady || !isInView) return undefined;
      return animateProfileAvatarFlip(spinnerRef.current, showImage ? frontRef.current : null);
    },
    { dependencies: [imageReady, flipKey, showImage, isInView], scope: stageRef }
  );

  const isInteractive = clickable && typeof onClick === "function";
  const interactiveClass = isInteractive
    ? " cursor-pointer hover:opacity-90 transition-opacity"
    : "";

  const handleImageError = () => {
    setImageFailed(true);
    setImageReady(true);
    onImageError?.();
  };

  const handleActivate = () => {
    if (isInteractive) onClick();
  };

  return (
    <div
      ref={stageRef}
      className={`relative shrink-0 [perspective:960px] [perspective-origin:center] ${className}`}
    >
      {showImage && !imageReady && (
        <div className="absolute inset-0 rounded-full border-2 border-gray-500/50 bg-gradient-to-br from-gray-500/35 via-cyan-500/10 to-gray-600/35" />
      )}
      <div
        ref={spinnerRef}
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ opacity: 0 }}
      >
        <div
          ref={frontRef}
          className={`absolute inset-0 overflow-hidden rounded-full [backface-visibility:hidden] ${borderClassName}${interactiveClass}`}
          onClick={isInteractive ? handleActivate : undefined}
          onKeyDown={
            isInteractive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleActivate();
                  }
                }
              : undefined
          }
          role={isInteractive ? "button" : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          aria-label={isInteractive && alt ? `Open ${alt} photo in new tab` : undefined}
        >
          {showImage ? (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              loading={imageLoading}
              onLoad={() => setImageReady(true)}
              onError={handleImageError}
              className={`h-full w-full object-cover ${imageClassName}`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-cyan-600/80 font-semibold text-richblack-25 ${initialsClassName}`}
            >
              {initials}
            </div>
          )}
        </div>
        <div
          aria-hidden
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/35 via-cyan-600/60 to-cyan-900/75 [backface-visibility:hidden] [transform:rotateY(180deg)] ${borderClassName}`}
        />
      </div>
    </div>
  );
}
