import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";
import { API_BASE_URL } from "../lib/config";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const googleLoginUrl = `${API_BASE_URL}/auth/login/google`;

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    // Avoid flashing the landing page while redirecting to feed
    return (
      <div className="min-h-screen bg-orange-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900">
      {/* Hero Section */}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 py-20 md:flex-row">
        <section className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-orange-100 px-4 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">Where ideas become reality</span>
          </div>
          
          <h1 className="text-4xl md:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-slate-900">
            Collaborate. Create.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
              Bring designs to life.
            </span>
          </h1>
          
          <p className="max-w-xl text-base md:text-lg text-slate-600 leading-relaxed">
            Collabfy connects <strong className="text-slate-800">designers</strong>, <strong className="text-slate-800">customers</strong>, and <strong className="text-slate-800">makers</strong> in one seamless platform.
            From concept sketches to finished products — collaborate and create together.
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={googleLoginUrl}
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all hover:scale-105 text-white"
              >
                Get Started Free
              </a>
              <a
                href={googleLoginUrl}
                className="rounded-2xl border border-orange-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-orange-50 transition-all"
              >
                Sign In
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/onboarding/profile"
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all hover:scale-105 text-white"
              >
                Continue
              </Link>
              <Link
                to="/onboarding/roles"
                className="rounded-2xl border border-orange-200 bg-white px-6 py-3 text-sm font-medium hover:bg-orange-50 transition-all text-slate-700"
              >
                Manage roles
              </Link>
            </div>
          )}

          <p className="text-xs text-slate-500 pt-2">
            Free to start • No credit card required
          </p>
        </section>

        {/* Right side - Feature preview */}
        <section className="flex-1">
          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="absolute -top-3 -right-3">
              <Logo size={50} />
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Active Projects</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">
                Live
              </span>
            </div>

            {/* Project cards */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Designer → Maker</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Modern furniture collection
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                    In Progress
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-white" />
                  </div>
                  <span className="text-xs text-slate-500">2 collaborators</span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Customer Request</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Custom product design needed
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    Open
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Looking for a designer to bring this idea to life
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Completed</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Brand identity package
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    Done
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-white" />
                  </div>
                  <span className="text-xs text-slate-500">3 collaborators</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* How it works */}
      <div className="border-t border-orange-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-2xl font-bold mb-12 text-slate-900">
            How Collabfy Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold">Share Your Vision</h3>
              <p className="text-sm text-slate-600">
                Designers share concepts, customers post requests, makers showcase capabilities.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold">Connect & Collaborate</h3>
              <p className="text-sm text-slate-600">
                Find the right partners, discuss ideas, and plan your project together.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold">Create Together</h3>
              <p className="text-sm text-slate-600">
                Turn designs into reality with seamless collaboration and project management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-2xl font-bold mb-4 text-slate-900">
          Built for Everyone in the Creative Process
        </h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          Whether you design, build, or bring ideas — there's a place for you.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 hover:border-orange-300 transition-colors">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="font-semibold text-lg mb-2">Designers & Creators</h3>
            <p className="text-sm text-slate-600">
              Share your portfolio, find clients, and collaborate with makers to bring your designs to life.
            </p>
          </div>
          
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 hover:border-amber-300 transition-colors">
            <div className="text-3xl mb-4">👤</div>
            <h3 className="font-semibold text-lg mb-2">Customers</h3>
            <p className="text-sm text-slate-600">
              Post your ideas, connect with talented designers, and watch your vision become reality.
            </p>
          </div>
          
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 hover:border-emerald-300 transition-colors">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="font-semibold text-lg mb-2">Makers & Builders</h3>
            <p className="text-sm text-slate-600">
              Bring designs to life. Connect with designers who need your skills to create real products.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-orange-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Ready to create something amazing?
          </h2>
          <p className="text-slate-600 mb-8">
            Join Collabfy today and start collaborating with designers, customers, and makers worldwide.
          </p>
          <a
            href={googleLoginUrl}
            className="inline-block rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all hover:scale-105 text-white"
          >
            Create Your Free Account
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
