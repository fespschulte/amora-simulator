import { PieChart, TrendingUp, DollarSign, Building } from "lucide-react";

import { Simulation } from "@/types/simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardSummaryProps {
  simulations: Simulation[];
}

export function DashboardSummary({ simulations }: DashboardSummaryProps) {
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
  );
}
