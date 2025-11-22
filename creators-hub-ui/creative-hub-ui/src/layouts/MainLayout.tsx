import { Link, Outlet, useLocation } from "react-router-dom";

const MainLayout = () => {
  const location = useLocation();

  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-accent" />
            <span className="text-lg font-semibold tracking-tight">
              Creative Hub
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {!isAuthPage && (
              <>
                <Link to="/login" className="hover:text-brand-accent">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full border border-brand-accent/70 px-4 py-1 text-xs font-medium hover:bg-brand-accent hover:text-black transition"
                >
                  Join as Creator
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-xs text-center text-white/50">
        © {new Date().getFullYear()} Creative Hub · Built for creators, tailors & brands
      </footer>
    </div>
  );
};

export default MainLayout;
