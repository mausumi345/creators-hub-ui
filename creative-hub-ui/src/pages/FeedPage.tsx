const FeedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-10">
          <p className="text-sm text-white/50">Welcome back</p>
          <h1 className="text-3xl font-bold mt-2">Your Creative Hub</h1>
          <p className="text-white/60 mt-2">
            Start exploring collabs, requests, and updates tailored to your active role.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/70">Feed coming soon.</p>
          <p className="text-white/40 text-sm mt-2">
            Switch roles in the top bar to see role-specific experiences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;

