"use client";

import { Boxes, MessageCircleHeart, Package, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showOnOpen } from "./ui";

const items = [
  ["/admin", "Comunidade", Users],
  ["/admin/pedidos", "Pedidos", Package],
  ["/admin/estoque", "Estoque", Boxes],
  ["/admin/mensagens", "Mensagens", MessageCircleHeart],
] as const;

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(([href, label, Icon]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`flex items-center gap-3 rounded-lg px-[11px] py-2.5 text-sm transition ${
              active ? "bg-leveza/12 font-semibold text-leveza" : "text-leveza/70 hover:bg-leveza/6 hover:text-leveza"
            }`}
          >
            <Icon className={`size-[18px] shrink-0 ${active ? "text-leveza" : "text-leveza/60"}`} strokeWidth={1.75} />
            <span className={showOnOpen}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
