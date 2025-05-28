"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { simulationsAPI } from "@/services/api";
import { Simulation } from "@/types/simulation";
import { SimulationHistory } from "@/components/SimulationHistory";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

export default function SimulationsListPage() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const data = await simulationsAPI.getAll();
        setSimulations(data);
      } catch (error) {
        console.error("Error fetching simulations:", error);
        toast("Erro ao carregar simulações", {
          description: "Não foi possível carregar sua lista de simulações.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSimulations();
  }, []);

  const handleEditSimulation = (id: number) => {
    router.push(`/dashboard/simulations/${id}`);
  };

  const handleDeleteSimulation = async (id: number) => {
    setLoading(true);
    try {
      await simulationsAPI.delete(id.toString());
      setSimulations(simulations.filter((sim) => sim.id !== id));
      toast("Simulação excluída", {
        description: "A simulação foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting simulation:", error);
      toast("Erro ao excluir simulação", {
        description: "Não foi possível remover a simulação. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Todas as Simulações" showBackButton />

      <SimulationHistory
        simulations={simulations}
        onEdit={handleEditSimulation}
        onDelete={handleDeleteSimulation}
        loading={loading}
      />
    </div>
  );
}
