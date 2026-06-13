"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

type NavOverlayCtx = {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
};

const NavOverlayContext = createContext<NavOverlayCtx>({
  isVisible: false,
  show: () => {},
  hide: () => {},
});

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  return (
    <NavOverlayContext.Provider value={{ isVisible, show, hide }}>
      {children}
    </NavOverlayContext.Provider>
  );
}

export function useNavigationOverlay(): NavOverlayCtx {
  return useContext(NavOverlayContext);
}
