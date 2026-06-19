/** Shell backdrop tuned for macOS liquid glass: soft wallpaper color behind material surfaces. */
export function LiquidGlassBackdrop({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[var(--v-bg)] ${
        theme === 'dark' ? 'macos-glass-wallpaper--dark' : 'macos-glass-wallpaper--light'
      }`}
      aria-hidden
    >
      <div className="macos-glass-orb macos-glass-orb--one" />
      <div className="macos-glass-orb macos-glass-orb--two" />
      <div className="macos-glass-orb macos-glass-orb--three" />
      <div className="macos-glass-vignette" />
    </div>
  );
}
