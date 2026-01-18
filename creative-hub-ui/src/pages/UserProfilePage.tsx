import { useMemo } from "react";

const UserProfilePage = () => {
  const skills = ["Custom stitching", "Saree fitting", "Suit tailoring", "Alterations", "Wedding attire", "Embroidery work"];
  const portfolio = useMemo(
    () => [
      { id: "p1", label: "Before", url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=60" },
      { id: "p2", label: "After", url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=60" },
      { id: "p3", label: "Before", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=60" },
      { id: "p4", label: "After", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=60" },
    ],
    []
  );

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row gap-6 items-center">
          <img
            src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=60"
            alt="Profile"
            className="w-32 h-32 rounded-2xl object-cover border border-white/10 shadow-xl"
          />
          <div className="flex-1 space-y-2">
            <div className="text-2xl font-semibold">Priya Sharma</div>
            <div className="text-white/70 flex items-center gap-3 text-sm">
              <span>⭐ 4.8</span>
              <span>📍 Mumbai, Maharashtra</span>
            </div>
            <div className="text-white/80 text-sm">Master Tailor &amp; Design Specialist</div>
            <div className="flex gap-2 text-xs text-white/70 mt-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">10+ yrs experience</span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Express delivery</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold mb-3">Skills &amp; Expertise</div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm text-white/80"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold mb-3">Portfolio</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {portfolio.map((item) => (
              <div key={item.id} className="relative rounded-2xl overflow-hidden border border-white/10">
                <img src={item.url} alt={item.label} className="w-full h-44 object-cover" />
                <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/20">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold mb-3">Profile Settings</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
            <div>
              <div className="text-white/50">Name</div>
              <div className="font-semibold">Priya Sharma</div>
            </div>
            <div>
              <div className="text-white/50">Location</div>
              <div className="font-semibold">Mumbai, Maharashtra</div>
            </div>
            <div>
              <div className="text-white/50">Rating</div>
              <div className="font-semibold">4.8</div>
            </div>
            <div>
              <div className="text-white/50">Specializations</div>
              <div className="font-semibold">Custom stitching, Saree fitting, Suit tailoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

