"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavigationProvider, useNavigationOverlay } from "./context";
import { Spinner } from "./Spinner";

export { NavigationProvider, useNavigationOverlay };
export { Spinner };

interface NavigationOverlayProps {
  /** Tailwind bg class for the overlay. Default: bg-black/60 */
  overlayColor?: string;
  /** Spinner diameter in px. Default: 32 */
  spinnerSize?: number;
  /** Spinner arc colour. Default: white */
  spinnerColor?: string;
}

function Overlay({
  overlayColor = "bg-black/60",
  spinnerSize = 32,
  spinnerColor = "white",
}: NavigationOverlayProps) {
  const pathname = usePathname();
  const { isVisible, hide } = useNavigationOverlay();

  // Auto-hide as soon as the new page pathname is committed
  useEffect(() => {
    hide();
  }, [pathname, hide]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${overlayColor}`}
      aria-hidden="true"
    >
      <Spinner size={spinnerSize} color={spinnerColor} />
    </div>
  );
}

/**
 * Drop this once inside <NavigationProvider> (typically src/app/layout.tsx).
 * Pair with useNavigationOverlay().show() on any link/button that triggers navigation.
 *
 * Usage in layout.tsx:
 *   <NavigationProvider>
 *     <NavigationOverlay />
 *     {children}
 *   </NavigationProvider>
 *
 * Usage anywhere in the app:
 *   const { show } = useNavigationOverlay();
 *   <button onClick={() => { show(); router.push('/somewhere'); }}>Go</button>
 */
export function NavigationOverlay(props: NavigationOverlayProps) {
  return <Overlay {...props} />;
}
