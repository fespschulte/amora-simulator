"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { simulationsAPI } from "@/services/api";
import { Simulation, SimulationUpdate } from "@/types/simulation";
import { SimulationForm } from "@/components/SimulationForm";
import { PageHeader } from "@/components/PageHeader";

export default function EditSimulationPage() {
  const router = useRouter();
  const params = useParams();
  const simulationId = params.id; // Get ID from URL params

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSimulation = async () => {
      if (!simulationId) {
        setLoading(false);
        // Optionally redirect or show error if no ID is provided
        toast("Erro", { description: "ID da simulação não fornecido." });
        return;
      }
      setLoading(true);
      try {
        // API getById expects string ID for the endpoint path
        const data = await simulationsAPI.getById(simulationId as string);
        setSimulation(data);
      } catch (error) {
        console.error("Error fetching simulation:", error);
        toast("Erro", {
          description: "Não foi possível carregar a simulação.",
        });
        setSimulation(null); // Set simulation to null on error
      } finally {
        setLoading(false);
      }
    };

    fetchSimulation();
  }, [simulationId]); // Re-run effect if simulationId changes

  const handleUpdateSimulation = async (formData: {
    // Temporary type for form data
    property_value: string;
    down_payment_percentage: number;
    contract_years: number;
    simulation_name?: string;
    notes?: string;
  }) => {
    if (!simulationId) return; // Should not happen if fetched successfully

    setIsSubmitting(true);
    try {
      // Format and prepare data for API - Only include fields allowed by SimulationUpdate
      const propertyValueNumber =
        parseFloat(
          formData.property_value.replace(/[^0-9,-]/g, "").replace(",", ".")
        ) || 0;

      const formattedData: SimulationUpdate = {
        // Use SimulationUpdate type
        property_value: propertyValueNumber,
        down_payment_percentage: formData.down_payment_percentage,
        contract_years: formData.contract_years,
        name: formData.simulation_name || null, // Map simulation_name to name
        notes: formData.notes || null,
      };

      // Call API to update simulation
      await simulationsAPI.update(simulationId as string, formattedData);

      toast("Simulação atualizada!", {
        description: "As alterações foram salvas.",
      });

      // Redirect back to simulations list or detail page
      router.push("/dashboard/simulations");
    } catch (error) {
      console.error("Error updating simulation:", error);
      toast("Erro ao atualizar simulação", {
        description: "Não foi possível salvar as alterações. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle case where simulation was not found or error occurred
  if (!simulation) {
    return (
      <div className="space-y-6">
        <PageHeader title="Simulação não encontrada" showBackButton />
        <p className="text-center text-gray-500">
          Não foi possível carregar os dados da simulação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar Simulação" showBackButton />

      <motion.div // Consider if motion is needed here
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Pass initial data to the form and the update handler */}
        <SimulationForm
          onSubmit={handleUpdateSimulation}
          initialData={{
            // Map simulation data to form data structure if necessary
            property_value: new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(simulation.property_value), // Format as currency
            down_payment_percentage: simulation.down_payment_percentage,
            contract_years: simulation.contract_years,
            simulation_name: simulation.name || "",
            notes: simulation.notes || "",
          }}
          isLoading={isSubmitting}
          // Add any other props needed by SimulationForm (e.g., isEditing flag)
        />
      </motion.div>
    </div>
  );
}
