export interface SimulationBase {
  property_value: number;
  down_payment_percentage: number;
  contract_years: number;
  name?: string | null;
  notes?: string | null;
}

export interface SimulationCreate extends SimulationBase {
  created_at?: Date;
}

export interface SimulationUpdate extends SimulationBase {
  updated_at?: Date;
}

export interface Simulation extends SimulationBase {
  id: number;
  user_id: number;
  down_payment_value: number;
  financing_amount: number;
  additional_costs: number;
  monthly_savings: number;
  created_at: string;
  updated_at: string;
}
