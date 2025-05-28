import { render, screen } from "@testing-library/react";
import { DashboardSummary } from "./DashboardSummary";
import { Simulation } from "@/types/simulation";

// Mock data
const mockSimulations: Simulation[] = [
  {
    id: 1,
    name: "Simulação 1",
    property_value: 500000,
    down_payment_percentage: 20,
    down_payment_value: 100000,
    additional_costs: 20000,
    contract_years: 30,
    financing_amount: 400000,
    monthly_savings: 1500,
    created_at: "2023-10-26T10:00:00Z",
    updated_at: "2023-10-26T10:00:00Z",
    user_id: 1,
  },
  {
    id: 2,
    name: "Simulação 2",
    property_value: 750000,
    down_payment_percentage: 10,
    down_payment_value: 75000,
    additional_costs: 30000,
    contract_years: 20,
    financing_amount: 675000,
    monthly_savings: 2000,
    created_at: "2023-11-15T12:00:00Z",
    updated_at: "2023-11-15T12:00:00Z",
    user_id: 1,
  },
  {
    id: 3,
    name: "Simulação 3",
    property_value: 300000,
    down_payment_percentage: 30,
    down_payment_value: 90000,
    additional_costs: 10000,
    contract_years: 15,
    financing_amount: 210000,
    monthly_savings: 1000,
    created_at: "2023-12-01T09:00:00Z",
    updated_at: "2023-12-01T09:00:00Z",
    user_id: 1,
  },
];

describe("DashboardSummary", () => {
  test("renders summary statistics correctly with simulations", () => {
    render(<DashboardSummary simulations={mockSimulations} />);

    // Check Total de Simulações
    expect(screen.getByText("Total de Simulações")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Check Valor Médio de Imóvel
    const totalPropertyValue = mockSimulations.reduce(
      (sum, sim) => sum + sim.property_value,
      0
    );
    const averagePropertyValue = totalPropertyValue / mockSimulations.length;
    const formattedAverage = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(averagePropertyValue);

    expect(screen.getByText("Valor Médio de Imóvel")).toBeInTheDocument();
    expect(screen.getByText(formattedAverage)).toBeInTheDocument();

    // Check Valor de Financiamento (most recent simulation)
    const mostRecentSimulation = mockSimulations.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const formattedFinancing = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(mostRecentSimulation.financing_amount);

    expect(screen.getByText("Valor de Financiamento")).toBeInTheDocument();
    expect(screen.getByText(formattedFinancing)).toBeInTheDocument();

    // Check Valor Mensal de Poupança (most recent simulation)
    const formattedSavings = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(mostRecentSimulation.monthly_savings);

    expect(screen.getByText("Valor Mensal de Poupança")).toBeInTheDocument();
    expect(screen.getByText(formattedSavings)).toBeInTheDocument();
  });

  test("renders zero/default values when no simulations are provided", () => {
    render(<DashboardSummary simulations={[]} />);

    // Check Total de Simulações
    expect(screen.getByText("Total de Simulações")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Check Valor Médio de Imóvel
    const formattedZero = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(0);
    expect(screen.getByText("Valor Médio de Imóvel")).toBeInTheDocument();
    expect(screen.getByText(formattedZero)).toBeInTheDocument(); // Should display R$ 0,00

    // Check Valor de Financiamento (no simulations)
    expect(screen.getByText("Valor de Financiamento")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument(); // Should display R$ 0,00

    // Check Valor Mensal de Poupança (no simulations)
    expect(screen.getByText("Valor Mensal de Poupança")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument(); // Should display R$ 0,00
  });
});
