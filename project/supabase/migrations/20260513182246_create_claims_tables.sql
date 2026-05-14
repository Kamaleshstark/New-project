/*
  # Insurance Claims Processing Agent Schema

  1. New Tables
    - `claims` — stores each processed FNOL claim with all extracted fields, routing result, and status
    - `claim_documents` — stores raw text/content of uploaded FNOL documents associated with claims

  2. Columns
    - claims: id, created_at, status, raw_text, extracted_fields (jsonb), missing_fields (jsonb array),
              recommended_route, reasoning, policy_number, policyholder_name, claim_type,
              estimated_damage, incident_date, incident_location
    - claim_documents: id, claim_id (fk), filename, content, created_at

  3. Security
    - RLS enabled on both tables
    - Public insert and select allowed (no auth required for demo purposes — agent is internal tool)
*/

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  raw_text text NOT NULL DEFAULT '',
  extracted_fields jsonb DEFAULT '{}'::jsonb,
  missing_fields jsonb DEFAULT '[]'::jsonb,
  recommended_route text DEFAULT '',
  reasoning text DEFAULT '',
  policy_number text DEFAULT '',
  policyholder_name text DEFAULT '',
  claim_type text DEFAULT '',
  estimated_damage numeric DEFAULT 0,
  incident_date text DEFAULT '',
  incident_location text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS claim_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  filename text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on claims"
  ON claims FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public select on claims"
  ON claims FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update on claims"
  ON claims FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert on claim_documents"
  ON claim_documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public select on claim_documents"
  ON claim_documents FOR SELECT
  TO anon, authenticated
  USING (true);
