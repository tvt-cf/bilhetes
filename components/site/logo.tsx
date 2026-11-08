import { useId } from "react";
import { logoComTagline, logoSemTagline } from "./logo-art";

// Logo oficial (vetor do BILHETES.ai) desenhado como SVG embutido: a cor vem do texto (currentColor)
// e o traço fica nítido em qualquer tela. O tamanho vem da largura passada em className.
export function Logo({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  const id = useId();
  const art = tagline ? logoComTagline : logoSemTagline;
  return (
    <svg
      viewBox={art.viewBox}
      role="img"
      aria-label={tagline ? "bilhetes, para viver maior" : "bilhetes"}
      className={`block h-auto ${className}`}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1015" height="320" dangerouslySetInnerHTML={{ __html: art.mask }} />
      <rect width="1015" height="320" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}
