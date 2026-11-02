import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · bilhetes admin", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-verdade px-5">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl bg-leveza p-10">
        <div className="flex flex-col items-center gap-1 text-verdade">
          <span className="font-script text-5xl leading-none">bilhetes</span>
          <span className="text-xs font-semibold tracking-[0.2em] text-tinta-suave">ADMIN</span>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
