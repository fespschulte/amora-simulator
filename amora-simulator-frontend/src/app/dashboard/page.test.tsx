import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";
import { Simulation } from "@/types/simulation";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API services
const mockGetAllSimulations = jest.fn();
const mockDeleteSimulation = jest.fn();
jest.mock("@/services/api", () => ({
  simulationsAPI: {
    getAll: mockGetAllSimulations,
    delete: mockDeleteSimulation,
  },
  authAPI: {
    isAuthenticated: jest.fn(() => true), // Assume authenticated for dashboard
    getCurrentUser: jest
      .fn()
      .mockResolvedValue({ username: "test", email: "test@example.com" }),
  },
}));

// Define prop types for mock components
interface MockSimulationHistoryProps {
  simulations: Simulation[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

interface MockDashboardSummaryProps {
  simulations: Simulation[];
}

// Mock SimulationHistory component to avoid rendering its internals
jest.mock("@/components/SimulationHistory", () => ({
  SimulationHistory: ({
    simulations,
    onEdit,
    onDelete,
    loading,
  }: MockSimulationHistoryProps) => (
    <div data-testid="simulation-history">
      {loading
        ? "Loading simulations..."
        : `Simulations count: ${simulations.length}`}
      {simulations.map((sim) => (
        <div key={sim.id} data-testid={`simulation-item-${sim.id}`}>
          {sim.name}
          <button onClick={() => onEdit(sim.id)}>Edit</button>
          <button onClick={() => onDelete(sim.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock DashboardSummary component
jest.mock("@/components/DashboardSummary", () => ({
  DashboardSummary: ({ simulations }: MockDashboardSummaryProps) => (
    <div data-testid="dashboard-summary">{`Summary for ${simulations.length} simulations`}</div>
  ),
}));

// Mock sonner toast
const mockToast = jest.fn();
jest.mock("sonner", () => ({
  toast: mockToast,
}));

// Mock console.error to check if errors are logged
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("DashboardPage", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGetAllSimulations.mockReset();
    mockDeleteSimulation.mockReset();
    mockPush.mockReset();
    mockToast.mockReset();
    consoleErrorSpy.mockClear(); // Clear console.error mock before each test
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore(); // Restore original console.error after all tests
  });

  test("fetches and displays simulations on mount", async () => {
    const mockSimulations = [
      {
        id: 1,
        name: "Sim 1",
        property_value: 100,
        down_payment_percentage: 10,
        down_payment_value: 10,
        additional_costs: 5,
        contract_years: 10,
        financing_amount: 90,
        monthly_savings: 5,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
      {
        id: 2,
        name: "Sim 2",
        property_value: 200,
        down_payment_percentage: 20,
        down_payment_value: 40,
        additional_costs: 10,
        contract_years: 20,
        financing_amount: 160,
        monthly_savings: 10,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
    ];
    mockGetAllSimulations.mockResolvedValue(mockSimulations);

    render(<DashboardPage />);

    // Expect API call to be made
    expect(mockGetAllSimulations).toHaveBeenCalledTimes(1);

    // Wait for simulations to be displayed
    await waitFor(() => {
      expect(screen.getByTestId("simulation-history")).toHaveTextContent(
        "Simulations count: 2"
      );
      expect(screen.getByTestId("dashboard-summary")).toHaveTextContent(
        "Summary for 2 simulations"
      );
      expect(screen.getByText("Sim 1")).toBeInTheDocument();
      expect(screen.getByText("Sim 2")).toBeInTheDocument();
    });
  });

  test("navigates to new simulation page when 'Nova Simulação' button is clicked", async () => {
    // Mock getAll to return an empty array so the button is present initially
    mockGetAllSimulations.mockResolvedValue([]);

    render(<DashboardPage />);

    // Wait for the loading state to clear and the button to be enabled
    await waitFor(() => {
      const newSimulationButton = screen.getByRole("button", {
        name: /Nova Simulação/i,
      });
      expect(newSimulationButton).toBeInTheDocument();
      expect(newSimulationButton).not.toBeDisabled();
    });

    const newSimulationButton = screen.getByRole("button", {
      name: /Nova Simulação/i,
    });
    await userEvent.click(newSimulationButton);

    // Expect router.push to have been called with the correct path
    expect(mockPush).toHaveBeenCalledWith("/dashboard/simulations/new");
  });

  test("renders correctly when there are no simulations", async () => {
    mockGetAllSimulations.mockResolvedValue([]);

    render(<DashboardPage />);

    // Expect API call to be made
    expect(mockGetAllSimulations).toHaveBeenCalledTimes(1);

    // Wait for the loading state to clear and the empty state to be rendered (via mocked SimulationHistory)
    await waitFor(() => {
      expect(screen.getByTestId("simulation-history")).toHaveTextContent(
        "Simulations count: 0"
      );
      expect(screen.getByTestId("dashboard-summary")).toHaveTextContent(
        "Summary for 0 simulations"
      );
      // Optionally check for specific text in the empty state if SimulationHistory renders it
      // For now, checking the count from the mock is sufficient.
    });
  });

  test("shows 'Ver todas as simulações' button and navigates correctly when more than 3 simulations", async () => {
    const mockSimulations = [
      {
        id: 1,
        name: "Sim 1",
        property_value: 100,
        down_payment_percentage: 10,
        down_payment_value: 10,
        additional_costs: 5,
        contract_years: 10,
        financing_amount: 90,
        monthly_savings: 5,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
      {
        id: 2,
        name: "Sim 2",
        property_value: 200,
        down_payment_percentage: 20,
        down_payment_value: 40,
        additional_costs: 10,
        contract_years: 20,
        financing_amount: 160,
        monthly_savings: 10,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
      {
        id: 3,
        name: "Sim 3",
        property_value: 300,
        down_payment_percentage: 30,
        down_payment_value: 90,
        additional_costs: 15,
        contract_years: 30,
        financing_amount: 210,
        monthly_savings: 15,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
      {
        id: 4,
        name: "Sim 4",
        property_value: 400,
        down_payment_percentage: 40,
        down_payment_value: 160,
        additional_costs: 20,
        contract_years: 40,
        financing_amount: 240,
        monthly_savings: 20,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
    ];
    mockGetAllSimulations.mockResolvedValue(mockSimulations);

    render(<DashboardPage />);

    // Wait for simulations to be displayed and the button to appear
    await waitFor(() => {
      const viewAllButton = screen.getByRole("button", {
        name: /Ver todas as simulações/i,
      });
      expect(viewAllButton).toBeInTheDocument();
    });

    const viewAllButton = screen.getByRole("button", {
      name: /Ver todas as simulações/i,
    });
    await userEvent.click(viewAllButton);

    // Expect router.push to have been called with the correct path
    expect(mockPush).toHaveBeenCalledWith("/dashboard/simulations");
  });

  test("deletes a simulation and updates the list", async () => {
    const initialSimulations = [
      {
        id: 1,
        name: "Sim 1",
        property_value: 100,
        down_payment_percentage: 10,
        down_payment_value: 10,
        additional_costs: 5,
        contract_years: 10,
        financing_amount: 90,
        monthly_savings: 5,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
      {
        id: 2,
        name: "Sim 2",
        property_value: 200,
        down_payment_percentage: 20,
        down_payment_value: 40,
        additional_costs: 10,
        contract_years: 20,
        financing_amount: 160,
        monthly_savings: 10,
        created_at: "",
        updated_at: "",
        user_id: 1,
      },
    ];
    const simulationToDeleteId = 1;

    mockGetAllSimulations.mockResolvedValue(initialSimulations);
    // Mock the delete call to resolve successfully
    mockDeleteSimulation.mockResolvedValue(undefined);

    render(<DashboardPage />);

    // Wait for simulations to be displayed
    await waitFor(() => {
      expect(
        screen.getByTestId(`simulation-item-${simulationToDeleteId}`)
      ).toBeInTheDocument();
    });

    // Simulate clicking the delete button for the first simulation
    const simulationItem = screen.getByTestId(
      `simulation-item-${simulationToDeleteId}`
    );
    const deleteButton = within(simulationItem).getByRole("button", {
      name: /delete/i,
    });
    await userEvent.click(deleteButton);

    // Note: The actual delete logic is inside handleDeleteSimulation on the page component
    // which is called by the mocked SimulationHistory component's onDelete prop.
    // We need to ensure that handleDeleteClick on the page component is triggered by the mock.
    // The current mock SimulationHistory directly calls onDelete, which works for this test.

    // Verify the API delete function was called
    expect(mockDeleteSimulation).toHaveBeenCalledWith(
      simulationToDeleteId.toString()
    );

    // Wait for the simulation to be removed from the list
    await waitFor(() => {
      expect(
        screen.queryByTestId(`simulation-item-${simulationToDeleteId}`)
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("simulation-history")).toHaveTextContent(
        "Simulations count: 1"
      );
    });

    // Verify the success toast was called
    expect(mockToast).toHaveBeenCalledWith(
      "Simulação excluída",
      expect.anything()
    );
  });

  test("handles error when fetching simulations", async () => {
    const error = new Error("Failed to fetch simulations");
    mockGetAllSimulations.mockRejectedValue(error);

    // Spy on console.error to check if it's called
    // This is already set up before all tests, just ensure it's cleared.

    render(<DashboardPage />);

    // Expect API call to be made
    expect(mockGetAllSimulations).toHaveBeenCalledTimes(1);

    // Wait for the loading state to clear
    await waitFor(() => {
      // Check if console.error was called with the expected error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching simulations:",
        error
      );
      // We could also check for a user-facing error message here if one is implemented.
    });
  });
});
