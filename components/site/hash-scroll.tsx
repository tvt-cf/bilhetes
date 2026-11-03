"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView();
}

// O Next nem sempre rola até a âncora: nem ao chegar de outra página (/manifesto → /#comprar),
// nem quando o endereço já tem o mesmo hash e a pessoa clica de novo depois de rolar.
export function HashScroll() {
  const pathname = usePathname();

  // chegada numa página com hash
  useEffect(() => {
    if (!window.location.hash) return;
    const frame = requestAnimationFrame(() => scrollToHash(window.location.hash));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // clique num link para uma âncora da página atual, mesmo que o hash não mude
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest("a[href*='#']");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      // fecha o menu do celular, se o link estiver dentro dele
      link.closest("details")?.removeAttribute("open");
      requestAnimationFrame(() => scrollToHash(url.hash));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
