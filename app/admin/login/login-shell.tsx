import { Logo } from "@/components/site/logo";

export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vinho px-5">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl bg-leveza p-10">
        <div className="flex flex-col items-center gap-1 text-verdade">
          <Logo tagline={false} className="w-[150px]" />
          <span className="text-xs font-semibold tracking-[0.2em] text-tinta-suave">ADMIN</span>
        </div>
        {children}
      </div>
    </main>
  );
}
