import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/feed", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    // Avoid flashing the landing page while redirecting to feed
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900">
      {/* Hero Section */}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 py-20 md:flex-row">
        <section className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70">Where ideas become reality</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Collaborate. Create.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500">
              Bring designs to life.
            </span>
          </h1>
          
          <p className="max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
            Creative Hub connects <strong className="text-white/80">designers</strong>, <strong className="text-white/80">customers</strong>, and <strong className="text-white/80">makers</strong> in one seamless platform. 
            From concept sketches to finished products — collaborate and create together.
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/onboarding/profile"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
              >
                Continue
              </Link>
              <Link
                to="/onboarding/roles"
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium hover:bg-white/5 transition-all"
              >
                Manage roles
              </Link>
            </div>
          )}

          <p className="text-xs text-white/40 pt-2">
            Free to start • No credit card required
          </p>
        </section>

        {/* Right side - Feature preview */}
        <section className="flex-1">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950 to-black p-6 shadow-2xl">
            <div className="absolute -top-3 -right-3">
              <Logo size={50} />
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">Active Projects</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                Live
              </span>
            </div>

            {/* Project cards */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-violet-400 font-medium">Designer → Maker</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Modern furniture collection
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                    In Progress
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border-2 border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-slate-900" />
                  </div>
                  <span className="text-xs text-white/50">2 collaborators</span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-amber-400 font-medium">Customer Request</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Custom product design needed
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                    Open
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  Looking for a designer to bring this idea to life
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-emerald-400 font-medium">Completed</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Brand identity package
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                    Done
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 border-2 border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-slate-900" />
                  </div>
                  <span className="text-xs text-white/50">3 collaborators</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* How it works */}
      <div className="border-t border-white/5 bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-2xl font-bold mb-12">
            How Creative Hub Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold">Share Your Vision</h3>
              <p className="text-sm text-white/60">
                Designers share concepts, customers post requests, makers showcase capabilities.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold">Connect & Collaborate</h3>
              <p className="text-sm text-white/60">
                Find the right partners, discuss ideas, and plan your project together.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold">Create Together</h3>
              <p className="text-sm text-white/60">
                Turn designs into reality with seamless collaboration and project management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-2xl font-bold mb-4">
          Built for Everyone in the Creative Process
        </h2>
        <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
          Whether you design, build, or bring ideas — there's a place for you.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-6 hover:border-violet-500/30 transition-colors">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="font-semibold text-lg mb-2">Designers & Creators</h3>
            <p className="text-sm text-white/60">
              Share your portfolio, find clients, and collaborate with makers to bring your designs to life.
            </p>
          </div>
          
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-6 hover:border-amber-500/30 transition-colors">
            <div className="text-3xl mb-4">👤</div>
            <h3 className="font-semibold text-lg mb-2">Customers</h3>
            <p className="text-sm text-white/60">
              Post your ideas, connect with talented designers, and watch your vision become reality.
            </p>
          </div>
          
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="font-semibold text-lg mb-2">Makers & Builders</h3>
            <p className="text-sm text-white/60">
              Bring designs to life. Connect with designers who need your skills to create real products.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/5 bg-gradient-to-b from-transparent to-violet-950/20">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-white/60 mb-8">
            Join Creative Hub today and start collaborating with designers, customers, and makers worldwide.
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
          >
            Create Your Free Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
