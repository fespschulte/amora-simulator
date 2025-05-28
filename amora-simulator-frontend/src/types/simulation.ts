export interface SimulationBase {
  property_value: number;
  down_payment_percentage: number;
  contract_years: number;
  name?: string | null;
  notes?: string | null;
}

export interface SimulationCreate extends SimulationBase {}

export interface SimulationUpdate extends SimulationBase {}

export interface Simulation extends SimulationBase {
  id: number;
  user_id: number;
  down_payment_value: number;
  financing_amount: number;
  additional_costs: number;
  monthly_savings: number;
  created_at: string; // Assuming datetime is sent as a string
  updated_at: string; // Assuming datetime is sent as a string
}
