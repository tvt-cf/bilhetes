export function Logo({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-script text-[2.75em] leading-[0.9]">bilhetes</span>
      {tagline && <span className="mt-0.5 text-[0.5em] tracking-[0.35em]">PARA VIVER MAIOR</span>}
    </span>
  );
}
