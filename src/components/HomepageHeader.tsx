import CyclingGuideMenu from '@/components/CyclingGuideMenu';

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M13.5 22v-8h2.75l.41-3.2H13.5V8.76c0-.93.26-1.56 1.59-1.56h1.7V4.34c-.29-.04-1.29-.13-2.45-.13-2.42 0-4.08 1.48-4.08 4.2v2.39H7.5V14h2.76v8h3.24Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: "Routes", href: "#routes", hover: "hover:bg-red-500 hover:text-white" },
  { label: "Jersey", href: "#jersey", hover: "hover:bg-yellow-400 hover:text-neutral-900" },
  { label: "Chat", href: "#chat", hover: "hover:bg-red-500 hover:text-white" },
  { label: "Rides", href: "#partners", hover: "hover:bg-yellow-400 hover:text-neutral-900" },
  { label: "Tracks", href: "#tracks", hover: "hover:bg-red-500 hover:text-white" },
  { label: "Contact", href: "#contact", hover: "hover:bg-yellow-400 hover:text-neutral-900" }
];

export default function HomepageHeader({ home = false }: { home?: boolean }) {
  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/IRIDEMALLORCA_LOGO.jpg" alt="I Ride Mallorca logo" className="h-10 w-10 object-contain rounded-md shadow-sm" />
            <span className="font-bold tracking-wide">I Ride Mallorca - More than a Ride</span>
          </div>
          <div className="flex items-center gap-2">
            <nav aria-label="Main navigation" className="hidden md:flex flex-wrap items-center justify-end gap-1 text-sm">
              {NAV_ITEMS.map((it) => (
                <a key={it.href} href={home ? it.href : `/${it.href}`} className={`px-3 py-2 rounded-md border border-transparent transition-all duration-200 ${it.hover}`}>
                  {it.label}
                </a>
              ))}
              <CyclingGuideMenu />
            </nav>
            <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
              <a href="https://www.facebook.com/i.ride.mallorca" target="_blank" rel="noreferrer" className="rounded-md p-2 text-neutral-700 transition hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label="Follow I Ride Mallorca on Facebook" title="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://www.instagram.com/iridemallorca/" target="_blank" rel="noreferrer" className="rounded-md p-2 text-neutral-700 transition hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label="Follow I Ride Mallorca on Instagram" title="Instagram">
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Mobile navigation" className="relative z-30 flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-white px-4 py-2 text-sm font-medium md:hidden">
        <a href="/routes/">Cycling routes</a>
        <a href="/jerseys/">Cycling jerseys</a>
        <a href="/about/">About</a>
        <CyclingGuideMenu />
      </nav>
    </>
  );
}
