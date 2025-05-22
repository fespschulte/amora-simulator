"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";

import { simulationsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { SimulationForm } from "@/components/SimulationForm";
import { useToast } from "@/components/ui/use-toast";

export default function NewSimulationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreateSimulation = async (simulationData: any) => {
    setLoading(true);
    try {
      // Format and prepare data for API
      const propertyValue =
        Number(simulationData.property_value.replace(/\D/g, "")) / 100;

      const formattedData = {
        property_value: propertyValue,
        down_payment_percentage: simulationData.down_payment_percentage,
        contract_years: simulationData.contract_years,
        down_payment_value:
          propertyValue * (simulationData.down_payment_percentage / 100),
        financing_amount:
          propertyValue * (1 - simulationData.down_payment_percentage / 100),
        additional_costs: propertyValue * 0.15,
        monthly_savings:
          (propertyValue * 0.15) / (simulationData.contract_years * 12),
        name: simulationData.simulation_name || null,
        notes: simulationData.notes || null,
      };

      // Call API to create simulation
      const response = await simulationsAPI.create(formattedData);

      toast({
        title: "Simulação criada com sucesso!",
        description: "Sua simulação foi salva.",
      });

      // Redirect to simulations list
      router.push("/dashboard/simulations");
    } catch (error) {
      console.error("Error creating simulation:", error);
      toast({
        title: "Erro ao criar simulação",
        description:
          "Ocorreu um erro ao salvar sua simulação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Nova Simulação</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SimulationForm onSubmit={handleCreateSimulation} isLoading={loading} />
      </motion.div>
    </div>
  );
}
