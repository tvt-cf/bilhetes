import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LoginShell } from "./login-shell";

export const metadata: Metadata = { title: "Entrar · bilhetes admin", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <LoginShell>
      <Suspense fallback={<LoginForm linkInvalid={false} />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </LoginShell>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { link } = await searchParams;
  return <LoginForm linkInvalid={link === "invalido"} />;
}
