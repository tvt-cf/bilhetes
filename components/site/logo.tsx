// Logo oficial (vetor do BILHETES.ai) como máscara, para herdar a cor do texto via currentColor.
// O tamanho vem da largura passada em className; a altura segue a proporção do desenho.
export function Logo({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  const src = tagline ? "/brand/bilhetes-logo.svg" : "/brand/bilhetes-wordmark.svg";
  const mask = `url(${src}) center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label={tagline ? "bilhetes, para viver maior" : "bilhetes"}
      className={`inline-block bg-current ${className}`}
      style={{ aspectRatio: tagline ? "1015 / 320" : "1015 / 232", mask, WebkitMask: mask }}
    />
  );
}
