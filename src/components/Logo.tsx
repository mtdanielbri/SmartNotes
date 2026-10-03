export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden focusable="false">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8183ff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#logo-bg)" />
      <rect x="96" y="116" width="92" height="132" rx="22" fill="#fff" />
      <rect x="96" y="268" width="92" height="88" rx="22" fill="#fff" opacity=".55" />
      <rect x="210" y="116" width="92" height="184" rx="22" fill="#ffe27a" />
      <rect x="324" y="116" width="92" height="92" rx="22" fill="#fff" opacity=".55" />
      <rect x="324" y="228" width="92" height="168" rx="22" fill="#9ff0c0" />
      <path d="m346 312 18 18 32-36" fill="none" stroke="#1d7a4b" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
