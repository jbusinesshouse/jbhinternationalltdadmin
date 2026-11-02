/**
 * Branded visual column for the login experience.
 * Pure CSS / SVG geometry — no remote assets.
 */
export function BrandPanel() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-ink via-ink to-ink-deep lg:flex lg:w-[46%] lg:shrink-0 lg:flex-col lg:justify-between">
      {/* Network / trade-route geometry */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg
          className="absolute inset-0 size-full opacity-[0.14]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="jbh-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jbh-grid)" />
          <g fill="none" stroke="white" strokeWidth="1" opacity="0.55">
            <path d="M-20 180 C 120 80, 280 280, 520 140" />
            <path d="M40 420 C 200 300, 360 500, 640 360" />
            <path d="M-40 560 C 180 480, 400 640, 720 520" />
          </g>
          <g fill="white">
            <circle cx="120" cy="140" r="3.5" opacity="0.7" />
            <circle cx="280" cy="220" r="2.5" opacity="0.5" />
            <circle cx="400" cy="160" r="3" opacity="0.65" />
            <circle cx="180" cy="380" r="2.5" opacity="0.45" />
            <circle cx="360" cy="440" r="3.5" opacity="0.6" />
            <circle cx="520" cy="340" r="2.5" opacity="0.5" />
          </g>
        </svg>
        <div className="absolute -left-24 top-1/4 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 size-64 rounded-full bg-white/[0.04] blur-2xl" />
      </div>

      <div className="relative z-10 px-10 pt-10 xl:px-14 xl:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f99a50] to-primary-dark text-base font-extrabold tracking-tight text-white shadow-[0_6px_16px_-4px_rgba(245,131,43,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]">
            J
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-white">JBH Admin</p>
            <p className="text-[11px] text-white/50">Operations console</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-10 xl:px-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          J Business House
        </p>
        <p className="mt-4 max-w-md text-[1.95rem] font-bold leading-[1.15] tracking-tight text-white xl:text-[2.4rem]">
          Connecting businesses across Bangladesh&apos;s wholesale marketplace.
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60 xl:text-[15px]">
          Manage sellers, orders, fees, and trust workflows from one calm,
          purpose-built operations console.
        </p>

        <dl className="mt-10 grid max-w-sm grid-cols-3 gap-3">
          {[
            { label: "Marketplace", value: "B2B" },
            { label: "Focus", value: "Ops" },
            { label: "Access", value: "Admin" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 backdrop-blur-sm"
            >
              <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white/90">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative z-10 px-10 pb-10 xl:px-14 xl:pb-12">
        <p className="text-xs text-white/35">© JBH International Limited</p>
      </div>
    </aside>
  );
}
