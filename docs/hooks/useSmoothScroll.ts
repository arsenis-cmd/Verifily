import { useEffect } from 'react';
import { initSmoothScroll } from '@/lib/smooth-scroll';

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = initSmoothScroll();

    return () => {
      lenis.destroy();
    };
  }, []);
}
