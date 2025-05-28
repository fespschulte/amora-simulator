"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, PieChart, User, LogOut, Menu } from "lucide-react";
import Image from "next/image";

import { authAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface User {
  id: string;
  username: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (!isAuth) {
          router.push("/");
        } else {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-800">
            <Image
              src="/logo-amora.svg"
              alt="aMora Logo"
              width={120}
              height={36}
              priority
            />
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <nav className="flex-1 px-2 py-4 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                <Home className="mr-3 h-5 w-5" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={() => router.push("/dashboard/simulations")}
              >
                <PieChart className="mr-3 h-5 w-5" />
                <span>Simulações</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-3 h-5 w-5" />
                <span>Perfil</span>
              </Button>
            </nav>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Image
            src="/logo-amora.svg"
            alt="aMora Logo"
            width={120}
            height={36}
            priority
          />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button className="cursor-pointer" variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pl-4 py-4">
                  <Image
                    src="/logo-amora.svg"
                    alt="aMora Logo"
                    width={120}
                    height={36}
                    priority
                  />
                </div>
                <nav className="flex-1 py-6 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => {
                      router.push("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home className="mr-3 h-5 w-5" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => {
                      router.push("/dashboard/simulations");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <PieChart className="mr-3 h-5 w-5" />
                    <span>Simulações</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => {
                      router.push("/dashboard/profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="mr-3 h-5 w-5" />
                    <span>Perfil</span>
                  </Button>
                </nav>
                <div className="pb-2 pt-4 px-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-3 mb-4 pl-2">
                    <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className="md:ml-64 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
