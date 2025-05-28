"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { authAPI } from "@/services/api";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          router.replace("/dashboard");
          return;
        }

        // Check if user just registered
        if (searchParams.get("registered") === "true") {
          toast("Cadastro realizado com sucesso!", {
            description: "Faça login para continuar.",
          });
          setIsLogin(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="flex justify-center mb-2">
          <Image
            src="/logo-amora.svg"
            alt="aMora Logo"
            width={200}
            height={60}
            priority
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Simulador de Compra de Imóvel
        </p>
      </div>

      {isLogin ? <LoginForm /> : <RegisterForm />}

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-primary hover:underline"
        >
          {isLogin
            ? "Não tem uma conta? Cadastre-se"
            : "Já tem uma conta? Faça login"}
        </button>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div>Carregando...</div>}>
        <AuthContent />
      </Suspense>
    </main>
  );
}
