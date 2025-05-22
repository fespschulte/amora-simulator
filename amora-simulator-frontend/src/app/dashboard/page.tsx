"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  PieChart,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  Building,
} from "lucide-react";

import { simulationsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimulationHistory } from "@/components/SimulationHistory";

interface Simulation {
  id: string;
  name: string | null;
  property_value: number;
  down_payment_percentage: number;
  contract_years: number;
  down_payment_value: number;
  financing_amount: number;
  additional_costs: number;
  monthly_savings: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

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

  const handleEditSimulation = (id: string) => {
    router.push(`/dashboard/simulations/${id}`);
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      await simulationsAPI.delete(id);
      setSimulations(simulations.filter((sim) => sim.id !== id));
    } catch (error) {
      console.error("Error deleting simulation:", error);
    }
  };

  // Calculate summary statistics
  const totalSimulations = simulations.length;
  const totalPropertyValue = simulations.reduce(
    (sum, sim) => sum + sim.property_value,
    0
  );
  const averagePropertyValue =
    totalSimulations > 0 ? totalPropertyValue / totalSimulations : 0;
  const mostRecentSimulation =
    simulations.length > 0
      ? [...simulations].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleNewSimulation}>
          <Plus className="mr-2 h-4 w-4" /> Nova Simulação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total de Simulações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PieChart className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">{totalSimulations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Valor Médio de Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {formatCurrency(averagePropertyValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Valor de Financiamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {mostRecentSimulation
                  ? formatCurrency(mostRecentSimulation.financing_amount)
                  : "R$ 0,00"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Simulação mais recente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Valor Mensal de Poupança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {mostRecentSimulation
                  ? formatCurrency(mostRecentSimulation.monthly_savings)
                  : "R$ 0,00"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Simulação mais recente</p>
          </CardContent>
        </Card>
      </div>

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
