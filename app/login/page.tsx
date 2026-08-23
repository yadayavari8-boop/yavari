import { Suspense } from "react";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
