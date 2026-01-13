'use client';

import { useSmoothScroll } from '@/hooks/useSmoothScroll';

export default function SmoothScrollWrapper({ children }: { children: React.ReactNode }) {
  useSmoothScroll();
  return <>{children}</>;
}
