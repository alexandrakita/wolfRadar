"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginAmbient } from "@/components/login-ambient";
import { LoginMarketingAside } from "@/components/login-marketing-aside";
import { LoginFormCard } from "@/components/login-form-card";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    router.push("/");
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <LoginAmbient />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        <LoginMarketingAside />
        <LoginFormCard
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
