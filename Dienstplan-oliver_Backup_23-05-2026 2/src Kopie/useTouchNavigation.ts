import { useEffect } from "react";

type TouchNavOptions = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
};

export function useTouchNavigation({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50
}: TouchNavOptions) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      endX = t.clientX;
      endY = t.clientY;
    }

    function handleTouchEnd() {
      const dx = endX - startX;
      const dy = endY - startY;

      // Horizontal
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -threshold && onSwipeLeft) onSwipeLeft();
        if (dx > threshold && onSwipeRight) onSwipeRight();
      }

      // Vertikal
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < -threshold && onSwipeUp) onSwipeUp();
        if (dy > threshold && onSwipeDown) onSwipeDown();
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
}
