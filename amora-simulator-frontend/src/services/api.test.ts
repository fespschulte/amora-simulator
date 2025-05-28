import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { authAPI, simulationsAPI } from "./api";
import { SimulationCreate, SimulationUpdate } from "../types/simulation";

// Mock axios
const mockAxios = new MockAdapter(axios);

// Mock localStorage and window.location
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockWindowLocation = {
  href: "",
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
});
Object.defineProperty(global, "window", {
  value: {
    location: mockWindowLocation,
  },
});

describe("API Service", () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockAxios.reset();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockWindowLocation.href = "";
  });

  afterEach(() => {
    // Restore original localStorage and window.location
    jest.restoreAllMocks();
  });

  test("request interceptor adds Authorization header if token exists in localStorage", async () => {
    const fakeToken = "fake-jwt-token";
    mockLocalStorage.getItem.mockReturnValue(fakeToken);

    mockAxios.onGet("/test").reply(200);

    await axios.get("/test");

    // Expect localStorage.getItem to have been called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth_token");

    // Expect the Authorization header to be set
    expect(mockAxios.history.get[0].headers).toHaveProperty(
      "Authorization",
      `Bearer ${fakeToken}`
    );
  });

  test("request interceptor does not add Authorization header if token does not exist", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    mockAxios.onGet("/test").reply(200);

    await axios.get("/test");

    // Expect localStorage.getItem to have been called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth_token");

    // Expect the Authorization header NOT to be set
    expect(mockAxios.history.get[0].headers).not.toHaveProperty(
      "Authorization"
    );
  });

  test("response interceptor redirects to login on 401 Unauthorized", async () => {
    mockAxios.onGet("/protected").reply(401);

    try {
      await axios.get("/protected");
    } catch (error: any) {
      // Explicitly type error as any
      // Expect localStorage.removeItem to have been called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("auth_token");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");

      // Expect window.location.href to have been set to the login page
      expect(mockWindowLocation.href).toBe("/");
    }

    // Ensure no other unexpected calls happened
    expect(mockLocalStorage.getItem).not.toHaveBeenCalled(); // Should not call getItem on response
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test("authAPI.login makes a POST request and stores token/user", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockResponseData = {
      access_token: "fake-jwt-token",
      token_type: "bearer",
      user: { id: "1", username: "testuser", email: email },
    };

    mockAxios.onPost("/auth/login").reply(200, mockResponseData);

    const response = await authAPI.login(email, password);

    // Expect Axios POST request to the correct endpoint with correct data
    expect(mockAxios.history.post.length).toBe(1);
    expect(mockAxios.history.post[0].url).toBe("/auth/login");
    expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
      email,
      password,
    });

    // Expect the correct response data to be returned
    expect(response).toEqual(mockResponseData);

    // Expect token and user to be stored in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "auth_token",
      mockResponseData.access_token
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockResponseData.user)
    );
  });

  test("authAPI.register makes a POST request", async () => {
    const username = "testuser";
    const email = "test@example.com";
    const password = "password123";
    const mockResponseData = { message: "User created successfully" };

    mockAxios.onPost("/auth/register").reply(200, mockResponseData);

    const response = await authAPI.register(username, email, password);

    // Expect Axios POST request to the correct endpoint with correct data
    expect(mockAxios.history.post.length).toBe(1); // Should be the second POST request after login test
    expect(mockAxios.history.post[1].url).toBe("/auth/register");
    expect(JSON.parse(mockAxios.history.post[1].data)).toEqual({
      username,
      email,
      password,
    });

    // Expect the correct response data to be returned
    expect(response).toEqual(mockResponseData);

    // Expect no localStorage activity on registration
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  test("authAPI.logout removes token and user from localStorage", () => {
    authAPI.logout();

    // Expect localStorage.removeItem to have been called for both keys
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("auth_token");
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");

    // Expect no API calls to have been made
    expect(mockAxios.history.get.length).toBe(0);
    expect(mockAxios.history.post.length).toBe(0);
    // Add checks for other HTTP methods if used in api.ts
  });

  test("authAPI.isAuthenticated checks for token in localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue("fake-token");
    expect(authAPI.isAuthenticated()).toBe(true);

    mockLocalStorage.getItem.mockReturnValue(null);
    expect(authAPI.isAuthenticated()).toBe(false);

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth_token");
    expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(2);
  });

  test("authAPI.getCurrentUser makes a GET request to /auth/me", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
    };
    mockAxios.onGet("/auth/me").reply(200, mockUser);

    const response = await authAPI.getCurrentUser();

    // Expect Axios GET request to the correct endpoint
    expect(mockAxios.history.get.length).toBe(1);
    expect(mockAxios.history.get[0].url).toBe("/auth/me");

    // Expect the correct response data to be returned
    expect(response).toEqual(mockUser);
  });

  test("simulationsAPI.getAll makes a GET request to /simulations", async () => {
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
    mockAxios.onGet("/simulations").reply(200, mockSimulations);

    const response = await simulationsAPI.getAll();

    // Expect Axios GET request to the correct endpoint
    expect(mockAxios.history.get.length).toBe(1); // This might need adjustment based on other GET tests
    expect(mockAxios.history.get[0].url).toBe("/simulations");

    // Expect the correct response data to be returned
    expect(response).toEqual(mockSimulations);
  });

  test("simulationsAPI.getById makes a GET request to /simulations/:id", async () => {
    const simulationId = "123";
    const mockSimulation = {
      id: 123,
      name: "Test Sim",
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
    };

    mockAxios.onGet(`/simulations/${simulationId}`).reply(200, mockSimulation);

    const response = await simulationsAPI.getById(simulationId);

    // Expect Axios GET request to the correct endpoint
    // Need to adjust the index based on previous GET tests
    const getRequests = mockAxios.history.get;
    const targetRequest = getRequests.find(
      (req) => req.url === `/simulations/${simulationId}`
    );

    expect(targetRequest).toBeDefined();
    expect(targetRequest?.url).toBe(`/simulations/${simulationId}`);

    // Expect the correct response data to be returned
    expect(response).toEqual(mockSimulation);
  });

  test("simulationsAPI.create makes a POST request to /simulations", async () => {
    const mockSimulationData: SimulationCreate = {
      name: "New Sim",
      property_value: 500000,
      down_payment_percentage: 20,
      contract_years: 30,
      notes: "Some notes",
    };
    const mockResponseData = {
      id: 4,
      user_id: 1,
      created_at: "",
      updated_at: "",
      financing_amount: 400000,
      monthly_savings: 1500,
      down_payment_value: 100000,
      additional_costs: 0,
      ...mockSimulationData,
    };

    mockAxios.onPost("/simulations").reply(201, mockResponseData);

    const response = await simulationsAPI.create(mockSimulationData);

    // Expect Axios POST request to the correct endpoint with correct data
    // Need to adjust the index based on previous POST tests
    const postRequests = mockAxios.history.post;
    const targetRequest = postRequests.find(
      (req) => req.url === "/simulations"
    );

    expect(targetRequest).toBeDefined();
    expect(targetRequest?.url).toBe("/simulations");
    expect(JSON.parse(targetRequest?.data)).toEqual(mockSimulationData);

    // Expect the correct response data to be returned
    expect(response).toEqual(mockResponseData);
  });

  test("simulationsAPI.update makes a PUT request to /simulations/:id", async () => {
    const simulationId = "123";
    const mockUpdateData: SimulationUpdate = {
      property_value: 600000,
      down_payment_percentage: 25,
      contract_years: 20,
      name: "Updated Sim",
      notes: "Updated notes",
    };
    const mockResponseData = {
      id: 123,
      user_id: 1,
      created_at: "",
      updated_at: "",
      financing_amount: 450000,
      monthly_savings: 1800,
      down_payment_value: 150000,
      additional_costs: 0,
      ...mockUpdateData,
    };

    mockAxios
      .onPut(`/simulations/${simulationId}`)
      .reply(200, mockResponseData);

    const response = await simulationsAPI.update(simulationId, mockUpdateData);

    // Expect Axios PUT request to the correct endpoint with correct data
    const putRequests = mockAxios.history.put;
    const targetRequest = putRequests.find(
      (req) => req.url === `/simulations/${simulationId}`
    );

    expect(targetRequest).toBeDefined();
    expect(targetRequest?.url).toBe(`/simulations/${simulationId}`);
    expect(JSON.parse(targetRequest?.data)).toEqual(mockUpdateData);

    // Expect the correct response data to be returned
    expect(response).toEqual(mockResponseData);
  });

  test("simulationsAPI.delete makes a DELETE request to /simulations/:id", async () => {
    const simulationId = "123";

    mockAxios.onDelete(`/simulations/${simulationId}`).reply(200); // Or 204 for no content response

    await simulationsAPI.delete(simulationId);

    // Expect Axios DELETE request to the correct endpoint
    const deleteRequests = mockAxios.history.delete;
    const targetRequest = deleteRequests.find(
      (req) => req.url === `/simulations/${simulationId}`
    );

    expect(targetRequest).toBeDefined();
    expect(targetRequest?.url).toBe(`/simulations/${simulationId}`);
  });
});

describe("authAPI", () => {
  it("should handle login error", async () => {
    const mockError = new Error("Invalid credentials");
    axios.post.mockRejectedValueOnce(mockError);

    await expect(authAPI.login("test@example.com", "password")).rejects.toThrow(
      "Invalid credentials"
    );
  });
});
