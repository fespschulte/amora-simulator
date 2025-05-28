"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { simulationsAPI } from "@/services/api";
import { SimulationCreate } from "@/types/simulation";
import { SimulationForm } from "@/components/SimulationForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewSimulationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateSimulation = async (formData: {
    property_value: string;
    down_payment_percentage: number;
    contract_years: number;
    simulation_name?: string;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      // Format and prepare data for API
      const propertyValueNumber =
        parseFloat(
          formData.property_value.replace(/[^0-9,-]/g, "").replace(",", ".")
        ) || 0;

      const formattedData: SimulationCreate = {
        property_value: propertyValueNumber,
        down_payment_percentage: formData.down_payment_percentage,
        contract_years: formData.contract_years,
        name: formData.simulation_name || null,
        notes: formData.notes || null,
      };

      // Call API to create simulation
      const response = await simulationsAPI.create(formattedData);
      const savedSimulation = response;
      toast("Simulação criada com sucesso!", {
        description: "Sua simulação foi salva.",
      });
      // Exibir o resultado do backend antes de redirecionar
      // alert(`Simulação salva com os seguintes valores calculados pelo backend:\n
      //   Valor da Entrada: ${new Intl.NumberFormat("pt-BR", {
      //     style: "currency",
      //     currency: "BRL",
      //   }).format(savedSimulation.down_payment_value)}\n
      //   Valor a Financiar: ${new Intl.NumberFormat("pt-BR", {
      //     style: "currency",
      //     currency: "BRL",
      //   }).format(savedSimulation.financing_amount)}\n
      //   Custos Adicionais: ${new Intl.NumberFormat("pt-BR", {
      //     style: "currency",
      //     currency: "BRL",
      //   }).format(savedSimulation.additional_costs)}\n
      //   Poupança Mensal: ${new Intl.NumberFormat("pt-BR", {
      //     style: "currency",
      //     currency: "BRL",
      //   }).format(savedSimulation.monthly_savings)}`);
      // Redirect to simulations list
      router.push("/dashboard/simulations");
    } catch (error) {
      console.error("Error creating simulation:", error);
      toast("Erro ao criar simulação", {
        description:
          "Ocorreu um erro ao salvar sua simulação. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Simulação" showBackButton />

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
