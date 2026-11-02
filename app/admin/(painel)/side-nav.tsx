"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Comunidade"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/envios", "Envios"],
] as const;

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2.5 text-sm transition ${
              active ? "bg-leveza/12 font-semibold text-leveza" : "text-leveza/70 hover:bg-leveza/6 hover:text-leveza"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
