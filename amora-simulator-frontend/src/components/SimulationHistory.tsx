"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Calendar,
  Home,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Simulation } from "../types/simulation";
import { useRouter } from "next/navigation";

interface SimulationHistoryProps {
  simulations?: Simulation[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
}

export function SimulationHistory({
  simulations = [],
  onEdit,
  onDelete,
  loading = false,
}: SimulationHistoryProps) {
  const router = useRouter();
  const [expandedSimulation, setExpandedSimulation] = useState<string | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<number | null>(
    null
  );

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDeleteClick = (id: number) => {
    setSimulationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (simulationToDelete !== null && onDelete) {
      onDelete(simulationToDelete);
    }
    setDeleteDialogOpen(false);
    setSimulationToDelete(null);
  };

  const toggleExpandSimulation = (id: number) => {
    if (expandedSimulation === id.toString()) {
      setExpandedSimulation(null);
    } else {
      setExpandedSimulation(id.toString());
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Carregando simulações...</p>
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Simulações</CardTitle>
          <CardDescription>
            Você ainda não criou nenhuma simulação
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Crie sua primeira simulação para acompanhar aqui
          </p>
          <Button onClick={() => router.push("/dashboard/simulations/new")}>
            Nova Simulação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Histórico de Simulações</h2>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/dashboard/simulations/new")}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Simulação
        </Button>
      </div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {simulations.map((simulation) => (
          <motion.div
            key={simulation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {simulation.name ||
                        `Simulação de ${formatValue(
                          simulation.property_value
                        )}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar size={14} />
                      {formatDate(simulation.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit && onEdit(simulation.id)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(simulation.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Home size={14} /> Valor do Imóvel
                    </p>
                    <p className="font-medium">
                      {formatValue(simulation.property_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Entrada
                    </p>
                    <p className="font-medium">
                      {formatValue(simulation.down_payment_value)}
                      <span className="text-xs text-gray-500 ml-1">
                        ({simulation.down_payment_percentage}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Financiamento
                    </p>
                    <p className="font-medium">
                      {formatValue(simulation.financing_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Prazo
                    </p>
                    <p className="font-medium">
                      {simulation.contract_years}{" "}
                      {simulation.contract_years === 1 ? "ano" : "anos"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => toggleExpandSimulation(simulation.id)}
                >
                  {expandedSimulation === simulation.id.toString() ? (
                    <span className="flex items-center gap-1">
                      Ver menos <ChevronUp size={16} />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      Ver mais <ChevronDown size={16} />
                    </span>
                  )}
                </Button>

                {expandedSimulation === simulation.id.toString() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Custos Adicionais (15%)
                        </p>
                        <p className="font-medium">
                          {formatValue(simulation.additional_costs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Poupança Mensal
                        </p>
                        <p className="font-medium">
                          {formatValue(simulation.monthly_savings)}
                        </p>
                      </div>
                    </div>

                    {simulation.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notas
                        </p>
                        <p className="text-sm">{simulation.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-2 text-xs text-gray-500 flex justify-between">
                      <span>ID: {simulation.id}</span>
                      <span>
                        Atualizado em: {formatDate(simulation.updated_at)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta simulação? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
