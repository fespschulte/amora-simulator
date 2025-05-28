import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardLayout from "./layout";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API services
const mockIsAuthenticated = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockLogout = jest.fn();
jest.mock("@/services/api", () => ({
  authAPI: {
    isAuthenticated: mockIsAuthenticated,
    getCurrentUser: mockGetCurrentUser,
    logout: mockLogout,
  },
}));

describe("DashboardLayout", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockPush.mockReset();
    mockIsAuthenticated.mockReset();
    mockGetCurrentUser.mockReset();
    mockLogout.mockReset();
  });

  test("redirects to login page if not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // Expect isAuthenticated to be checked
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);

    // Wait for the redirection to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    // Ensure user data fetching is not attempted
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  test("fetches and displays user information if authenticated", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
    };
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue(mockUser);

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // Expect isAuthenticated to be checked
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    // Expect getCurrentUser to be called
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);

    // Wait for user information to be displayed
    await waitFor(() => {
      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    // Ensure redirection does not happen
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("logs out and redirects to login page when logout button is clicked", async () => {
    // Simulate authenticated state
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      username: "testuser",
      email: "test@example.com",
    });
    mockLogout.mockResolvedValue(undefined); // Mock logout to resolve successfully

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // Wait for the layout to load and the logout button to be present
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
    });

    // Simulate clicking the logout button
    const logoutButton = screen.getByRole("button", { name: /Sair/i });
    await userEvent.click(logoutButton);

    // Expect the logout API call to be made
    expect(mockLogout).toHaveBeenCalledTimes(1);

    // Expect redirection to the login page
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  test("navigates correctly when sidebar links are clicked", async () => {
    // Simulate authenticated state
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      username: "testuser",
      email: "test@example.com",
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // Wait for the layout to load and navigation links to be present
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Dashboard/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Simulações/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Perfil/i })
      ).toBeInTheDocument();
    });

    // Test Dashboard link
    const dashboardLink = screen.getByRole("button", { name: /Dashboard/i });
    await userEvent.click(dashboardLink);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");

    // Reset mockPush for the next click
    mockPush.mockReset();

    // Test Simulações link
    const simulationsLink = screen.getByRole("button", { name: /Simulações/i });
    await userEvent.click(simulationsLink);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/simulations");

    // Reset mockPush for the next click
    mockPush.mockReset();

    // Test Perfil link
    const profileLink = screen.getByRole("button", { name: /Perfil/i });
    await userEvent.click(profileLink);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/profile");
  });
});
