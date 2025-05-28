import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the authAPI - we don't want to make actual API calls in component tests
const mockLogin = jest.fn();
jest.mock(
  "@/services/api",
  () => ({
    authAPI: {
      login: mockLogin,
      isAuthenticated: jest.fn(() => false), // Assume not authenticated for LoginForm rendering
    },
  }),
  { virtual: true }
);

describe("LoginForm", () => {
  test("renders email and password inputs and a login button", () => {
    render(<LoginForm />);

    // Check if email input is present
    const emailInput = screen.getByPlaceholderText("seu@email.com");
    expect(emailInput).toBeInTheDocument();

    // Check if password input is present
    const passwordInput = screen.getByPlaceholderText("******");
    expect(passwordInput).toBeInTheDocument();

    // Check if login button is present
    const loginButton = screen.getByRole("button", { name: /entrar/i });
    expect(loginButton).toBeInTheDocument();
  });

  test("handles successful login", async () => {
    // Reset and set mock implementation for this specific test
    mockLogin.mockReset().mockResolvedValue({
      access_token: "fake-token",
      user: { username: "test", email: "test@example.com" },
    });
    mockPush.mockReset();

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText("seu@email.com");
    const passwordInput = screen.getByPlaceholderText("******");
    const loginButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(loginButton);

    // Wait for the async login process to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("displays error message on failed login", async () => {
    // Reset and set mock implementation for this specific test
    const errorMessage = "Invalid credentials";
    mockLogin
      .mockReset()
      .mockRejectedValue({ response: { data: { detail: errorMessage } } });
    mockPush.mockReset();

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText("seu@email.com");
    const passwordInput = screen.getByPlaceholderText("******");
    const loginButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(loginButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // We can add more tests later, e.g., simulating typing and submission
});
