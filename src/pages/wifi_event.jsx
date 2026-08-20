import { useEffect, useState } from "react";
import { getImagesFromCloudinaryFolder } from "../services/api";

const FOLDER_NAME = "wifi_event";

function WifiEventCollage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadImages = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getImagesFromCloudinaryFolder(FOLDER_NAME);
        if (!ignore) {
          setImages(Array.isArray(data?.images) ? data.images : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.message || "Failed to load images from WiFi Event folder.",
          );
          setImages([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadImages();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#242537] pt-20 sm:pt-24">
      {loading && (
        <div className="flex min-h-screen items-center justify-center bg-[#050816]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div className="columns-2 gap-3 px-3 pb-3 sm:columns-3 lg:columns-4 lg:gap-4">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group mb-3 break-inside-avoid overflow-hidden rounded-[20px] bg-black/20 lg:mb-4"
            >
              <img
                src={src}
                alt="WiFi event"
                className="block h-auto w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-white/60">
          No images found
        </div>
      )}
    </div>
  );
}

export default WifiEventCollage;
