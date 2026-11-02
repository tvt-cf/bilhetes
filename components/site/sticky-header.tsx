"use client";

import { useEffect, useState } from "react";

// Barra do topo que compacta depois que a página começa a rolar (marca data-compact para os filhos).
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const update = () => setCompact(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header
      data-compact={compact}
      className="group sticky top-0 z-30 border-b border-verdade/10 bg-leveza/90 backdrop-blur transition-[background-color] data-[compact=true]:bg-leveza/95"
    >
      {children}
    </header>
  );
}
