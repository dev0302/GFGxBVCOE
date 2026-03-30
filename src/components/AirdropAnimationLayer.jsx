import { useEffect, useRef } from "react";
import { animateImageTransfer, registerAirdropRunner } from "../animations/airdropAnimation";

export default function AirdropAnimationLayer() {
  const layerRef = useRef(null);

  useEffect(() => {
    return registerAirdropRunner((payload) =>
      animateImageTransfer({
        layerEl: layerRef.current,
        ...payload,
      })
    );
  }, []);

  return (
    <div
      id="airdrop-animation-layer"
      ref={layerRef}
      className="pointer-events-none fixed left-0 top-0 z-[140] h-full w-full"
    />
  );
}

