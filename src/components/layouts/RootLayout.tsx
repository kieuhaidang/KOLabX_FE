import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";

export function RootLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {children || <Outlet />}
    </div>
  );
}
