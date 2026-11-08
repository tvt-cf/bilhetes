import { useId } from "react";
import { logoComTagline, logoSemTagline } from "./logo-art";

// Logo oficial desenhado como SVG embutido: a cor vem do texto (currentColor)
// e o traço fica nítido em qualquer tela. O tamanho vem da largura passada em className.
export function Logo({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  const id = useId();
  const art = tagline ? logoComTagline : logoSemTagline;
  const [x, y, w, h] = art.viewBox;
  return (
    <svg
      viewBox={art.viewBox.join(" ")}
      role="img"
      aria-label={tagline ? "bilhetes, para viver maior" : "bilhetes"}
      className={`block h-auto ${className}`}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h} dangerouslySetInnerHTML={{ __html: art.mask }} />
      <rect x={x} y={y} width={w} height={h} fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}
