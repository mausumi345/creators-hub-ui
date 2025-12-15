import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Spacer for fixed TopBar */}
      <div className="h-16" />

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 py-6 text-xs text-center text-white/40">
        © 2026 Creative Hub · Where ideas become reality
      </footer>
    </div>
  );
};

export default MainLayout;
