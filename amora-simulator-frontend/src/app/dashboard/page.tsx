"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { simulationsAPI } from "@/services/api";
import { Simulation } from "@/types/simulation";
import { Button } from "@/components/ui/button";
import { SimulationHistory } from "@/components/SimulationHistory";
import { DashboardSummary } from "@/components/DashboardSummary";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
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
      } finally {
        setLoading(false);
      }
    };

    fetchSimulations();
  }, []);

  const handleNewSimulation = () => {
    router.push("/dashboard/simulations/new");
  };

  const handleEditSimulation = (id: number) => {
    router.push(`/dashboard/simulations/${id}`);
  };

  const handleDeleteSimulation = async (id: number) => {
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
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        action={
          <Button className="cursor-pointer" onClick={handleNewSimulation}>
            <Plus className="mr-2 h-4 w-4" /> Nova Simulação
          </Button>
        }
      />

      {/* Summary Cards */}
      <DashboardSummary simulations={simulations} />

      {/* Recent Simulations */}
      <div>
        <h2 className="text-xl font-bold mb-4">Simulações Recentes</h2>
        <SimulationHistory
          simulations={simulations.slice(0, 3)}
          onEdit={handleEditSimulation}
          onDelete={handleDeleteSimulation}
          loading={loading}
        />
        {simulations.length > 3 && (
          <div className="mt-4 text-center">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => router.push("/dashboard/simulations")}
            >
              Ver todas as simulações
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
