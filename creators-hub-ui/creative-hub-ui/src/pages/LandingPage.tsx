const LandingPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-16 md:flex-row">
      <section className="flex-1 space-y-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-accent/80">
          Fashion · Creators · Tailors · Marketplace
        </p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Build, share & sell{" "}
          <span className="text-brand-accent">fashion stories</span>, not just outfits.
        </h1>
        <p className="max-w-xl text-sm md:text-base text-white/70">
          Creative Hub connects designers, tailors, and real customers.
          Co-create outfits, manage orders, and showcase your portfolio in one place –
          from first sketch to final stitch.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/signup"
            className="rounded-full bg-brand-purple px-5 py-2 text-sm font-medium shadow-lg shadow-brand-purple/40 hover:bg-brand-purple/90 transition"
          >
            Start as Creator
          </a>
          <a
            href="/login"
            className="rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10 transition"
          >
            I’m a Tailor / Customer
          </a>
        </div>

        <div className="mt-4 text-xs text-white/50">
          No credit card, no fees for early creators. Just your creativity.
        </div>
      </section>

      <section className="mt-10 flex-1 md:mt-0">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#241133] via-[#130b1f] to-[#07040d] p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-xs text-white/60">
            <span>Live creator board</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
              alpha preview
            </span>
          </div>

          {/* Simple preview cards */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/60">Designer · Mumbai</p>
              <p className="mt-1 text-sm font-semibold">
                “Saree to streetwear” fusion collection
              </p>
              <div className="mt-2 flex gap-2 text-[11px] text-white/60">
                <span className="rounded-full bg-black/40 px-2 py-0.5">
                  Looking for: Tailor
                </span>
                <span className="rounded-full bg-black/40 px-2 py-0.5">
                  Pre-orders open
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/5 p-3">
              <p className="text-xs text-white/70">Customer · Bangalore</p>
              <p className="mt-1 text-sm font-semibold">
                Wedding lehenga + matching kid outfit
              </p>
              <div className="mt-2 flex gap-2 text-[11px] text-white/70">
                <span className="rounded-full bg-black/40 px-2 py-0.5">
                  Budget visible
                </span>
                <span className="rounded-full bg-black/40 px-2 py-0.5">
                  6 designers invited
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
