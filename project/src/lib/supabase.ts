import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Claim = {
  id: string;
  created_at: string;
  status: string;
  raw_text: string;
  extracted_fields: Record<string, string | null>;
  missing_fields: string[];
  recommended_route: string;
  reasoning: string;
  policy_number: string;
  policyholder_name: string;
  claim_type: string;
  estimated_damage: number;
  incident_date: string;
  incident_location: string;
};
