"use client";

import { useEffect, useRef, useState } from "react";

// Faixa de fotos que no celular desliza para o lado, com "1 / 4", barra de progresso e a dica "deslize".
// No desktop as fotos ficam em grade e o indicador some.
export function Carrossel({ total, className, children }: { total: number; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fracao, setFracao] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setFracao(max > 0 ? el.scrollLeft / max : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);
  const atual = Math.round(fracao * (total - 1)) + 1;
  return (
    <>
      <div ref={ref} className={className}>
        {children}
      </div>
      <div aria-hidden className="mx-5 mb-6 mt-5 flex items-center gap-3.5 font-mono text-[13px] md:hidden">
        <span className="text-luz">
          {atual} / {total}
        </span>
        <span className="relative h-0.5 flex-1 rounded-full bg-leveza/20">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-luz transition-[width] duration-150"
            style={{ width: `${(atual / total) * 100}%` }}
          />
        </span>
        <span className="text-leveza/70">deslize →</span>
      </div>
    </>
  );
}
