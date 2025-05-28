import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock authAPI
const mockRegister = jest.fn();
jest.mock("@/services/api", () => ({
  authAPI: {
    register: mockRegister,
  },
}));

describe("RegisterForm", () => {
  test("renders registration form with all required fields", () => {
    render(<RegisterForm />);

    // Check if all form fields are present
    expect(screen.getByPlaceholderText("seu_usuario")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("******")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /cadastrar/i })
    ).toBeInTheDocument();
  });

  test("handles successful registration", async () => {
    // Reset and set mock implementation for this specific test
    mockRegister
      .mockReset()
      .mockResolvedValue({ message: "User created successfully" });
    mockPush.mockReset();

    render(<RegisterForm />);

    // Fill in the form
    await userEvent.type(
      screen.getByPlaceholderText("seu_usuario"),
      "testuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("seu@email.com"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[0],
      "password123"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[1],
      "password123"
    );

    // Submit the form
    await userEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    // Wait for the async registration process to complete
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "testuser",
        "test@example.com",
        "password123"
      );
      expect(mockPush).toHaveBeenCalledWith("/?registered=true");
    });
  });

  test("displays error message on failed registration", async () => {
    // Reset and set mock implementation for this specific test
    const errorMessage = "Email já registrado";
    mockRegister
      .mockReset()
      .mockRejectedValue({ response: { data: { detail: errorMessage } } });
    mockPush.mockReset();

    render(<RegisterForm />);

    // Fill in the form
    await userEvent.type(
      screen.getByPlaceholderText("seu_usuario"),
      "testuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("seu@email.com"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[0],
      "password123"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[1],
      "password123"
    );

    // Submit the form
    await userEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("validates password match", async () => {
    render(<RegisterForm />);

    // Fill in the form with mismatched passwords
    await userEvent.type(
      screen.getByPlaceholderText("seu_usuario"),
      "testuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("seu@email.com"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[0],
      "password123"
    );
    await userEvent.type(
      screen.getAllByPlaceholderText("******")[1],
      "differentpassword"
    );

    // Submit the form
    await userEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    // Check for validation message
    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
  });
});
