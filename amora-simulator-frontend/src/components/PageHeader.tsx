"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  showBackButton = false,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4">
      {showBackButton && (
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <h1 className="text-3xl font-bold flex-1">{title}</h1>
      {action}
    </div>
  );
}
