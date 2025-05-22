"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Filter,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
} from "lucide-react";

import { simulationsAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimulationHistory } from "@/components/SimulationHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type SortField = "created_at" | "property_value" | "name";
type SortOrder = "asc" | "desc";

export default function SimulationsPage() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const data = await simulationsAPI.getAll();
        setSimulations(data);
        setFilteredSimulations(data);
      } catch (error) {
        console.error("Error fetching simulations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimulations();
  }, []);

  useEffect(() => {
    // Filter simulations based on search term
    const filtered = simulations.filter((sim) => {
      const name = sim.name || `Simulação ${sim.id}`;
      const propertyValue = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(sim.property_value);

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        propertyValue.includes(searchTerm) ||
        (sim.notes &&
          sim.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    // Sort simulations
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "created_at") {
        return sortOrder === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === "property_value") {
        return sortOrder === "asc"
          ? a.property_value - b.property_value
          : b.property_value - a.property_value;
      } else {
        const nameA = a.name || `Simulação ${a.id}`;
        const nameB = b.name || `Simulação ${b.id}`;
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    });

    setFilteredSimulations(sorted);
  }, [simulations, searchTerm, sortField, sortOrder]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minhas Simulações</h1>
        <Button onClick={handleNewSimulation}>
          <Plus className="mr-2 h-4 w-4" /> Nova Simulação
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar simulações..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("created_at")}>
                <Calendar className="mr-2 h-4 w-4" />
                Data de criação
                {sortField === "created_at" &&
                  (sortOrder === "asc" ? (
                    <ArrowDownAZ className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpAZ className="ml-2 h-4 w-4" />
                  ))}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("property_value")}>
                <Filter className="mr-2 h-4 w-4" />
                Valor do imóvel
                {sortField === "property_value" &&
                  (sortOrder === "asc" ? (
                    <ArrowDownAZ className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpAZ className="ml-2 h-4 w-4" />
                  ))}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("name")}>
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                Nome
                {sortField === "name" &&
                  (sortOrder === "asc" ? (
                    <ArrowDownAZ className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpAZ className="ml-2 h-4 w-4" />
                  ))}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SimulationHistory
        simulations={filteredSimulations}
        onEdit={handleEditSimulation}
        onDelete={handleDeleteSimulation}
        loading={loading}
      />
    </div>
  );
}
