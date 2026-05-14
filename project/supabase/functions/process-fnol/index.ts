import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MANDATORY_FIELDS = [
  "policyNumber",
  "policyholderName",
  "effectiveDates",
  "incidentDate",
  "incidentTime",
  "incidentLocation",
  "incidentDescription",
  "claimant",
  "contactDetails",
  "assetType",
  "assetId",
  "estimatedDamage",
  "claimType",
  "initialEstimate",
];

const FRAUD_KEYWORDS = ["fraud", "inconsistent", "staged", "fabricated", "false claim", "suspicious"];

function extractFields(text: string): Record<string, string | null> {
  const lower = text.toLowerCase();
  const extracted: Record<string, string | null> = {};

  // Policy Number
  const policyMatch = text.match(/policy\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  extracted.policyNumber = policyMatch?.[1] ?? null;

  // Policyholder Name
  const nameMatch = text.match(/(?:policyholder|insured|name of insured)\s*[:\-]?\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})/i);
  extracted.policyholderName = nameMatch?.[1] ?? null;

  // Effective Dates
  const effectiveMatch = text.match(/effective\s*(?:date|period|dates?)\s*[:\-]?\s*([\d\/\-\s]+(?:to|through|-)[\d\/\-\s]+)/i);
  extracted.effectiveDates = effectiveMatch?.[1]?.trim() ?? null;

  // Incident Date
  const dateMatch = text.match(/(?:date\s+of\s+(?:loss|incident|accident)|incident\s+date|loss\s+date)\s*[:\-]?\s*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i);
  extracted.incidentDate = dateMatch?.[1] ?? null;

  // Incident Time
  const timeMatch = text.match(/(?:time\s+of\s+(?:loss|incident|accident)|incident\s+time)\s*[:\-]?\s*([\d]{1,2}:[\d]{2}\s*(?:AM|PM)?)/i);
  extracted.incidentTime = timeMatch?.[1] ?? null;

  // Location
  const locationMatch = text.match(/(?:location\s+of\s+(?:loss|incident)|incident\s+location|location)\s*[:\-]?\s*([^\n,]+(?:,\s*[^\n,]+)*)/i);
  extracted.incidentLocation = locationMatch?.[1]?.trim() ?? null;

  // Description
  const descMatch = text.match(/(?:description\s+of\s+(?:accident|incident|loss)|incident\s+description)\s*[:\-]?\s*([^\n]{20,})/i);
  extracted.incidentDescription = descMatch?.[1]?.trim() ?? null;

  // Claimant
  const claimantMatch = text.match(/(?:claimant|reported\s+by|claim(?:ant)?'?s?\s+name)\s*[:\-]?\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})/i);
  extracted.claimant = claimantMatch?.[1] ?? null;

  // Third Parties
  const thirdPartyMatch = text.match(/(?:third\s+part(?:y|ies)|other\s+(?:driver|party|parties))\s*[:\-]?\s*([^\n]+)/i);
  extracted.thirdParties = thirdPartyMatch?.[1]?.trim() ?? null;

  // Contact Details
  const phoneMatch = text.match(/(?:phone|cell|contact|tel)\s*[:\-]?\s*([\+\d\s\-\(\)]{7,20})/i);
  extracted.contactDetails = phoneMatch?.[1]?.trim() ?? null;

  // Asset Type
  const assetTypeMatch = text.match(/(?:asset\s+type|vehicle\s+type|type\s+of\s+(?:vehicle|asset|property))\s*[:\-]?\s*([^\n,]+)/i);
  extracted.assetType = assetTypeMatch?.[1]?.trim() ?? null;

  // Asset ID (VIN, plate, property ID)
  const assetIdMatch = text.match(/(?:asset\s+id|vin|vehicle\s+identification|plate\s+(?:number|no))\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  extracted.assetId = assetIdMatch?.[1] ?? null;

  // Estimated Damage
  const damageMatch = text.match(/(?:estimated?\s+(?:damage|amount|loss)|estimate\s+amount|damage\s+estimate)\s*[:\-]?\s*\$?([\d,]+(?:\.\d{1,2})?)/i);
  extracted.estimatedDamage = damageMatch?.[1]?.replace(/,/g, "") ?? null;

  // Claim Type
  const claimTypeMatch = text.match(/(?:claim\s+type|type\s+of\s+claim|line\s+of\s+business)\s*[:\-]?\s*([^\n,]+)/i);
  extracted.claimType = claimTypeMatch?.[1]?.trim() ?? null;

  // Attachments
  const attachMatch = text.match(/(?:attachments?|attached\s+documents?|supporting\s+documents?)\s*[:\-]?\s*([^\n]+)/i);
  extracted.attachments = attachMatch?.[1]?.trim() ?? null;

  // Initial Estimate
  const initialEstMatch = text.match(/(?:initial\s+estimate|preliminary\s+estimate)\s*[:\-]?\s*\$?([\d,]+(?:\.\d{1,2})?)/i);
  extracted.initialEstimate = initialEstMatch?.[1]?.replace(/,/g, "") ?? extracted.estimatedDamage;

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  extracted.email = emailMatch?.[0] ?? null;

  return extracted;
}

function determineMissingFields(extracted: Record<string, string | null>): string[] {
  return MANDATORY_FIELDS.filter((field) => !extracted[field]);
}

function determineRoute(
  extracted: Record<string, string | null>,
  missingFields: string[],
  rawText: string
): { route: string; reasoning: string } {
  const lower = rawText.toLowerCase();
  const reasons: string[] = [];

  // Check fraud keywords first (highest priority)
  const fraudFound = FRAUD_KEYWORDS.filter((kw) => lower.includes(kw));
  if (fraudFound.length > 0) {
    return {
      route: "Investigation Flag",
      reasoning: `Claim description contains suspicious keywords: ${fraudFound.join(", ")}. This claim has been flagged for investigation to verify authenticity before processing.`,
    };
  }

  // Injury claim
  const claimType = (extracted.claimType ?? "").toLowerCase();
  if (claimType.includes("injury") || claimType.includes("bodily") || claimType.includes("personal injury")) {
    return {
      route: "Specialist Queue",
      reasoning: `Claim type is "${extracted.claimType}", which requires specialized handling by a medical and legal specialist team. Injury claims involve liability assessment, medical records review, and potential litigation.`,
    };
  }

  // Missing mandatory fields
  if (missingFields.length > 0) {
    return {
      route: "Manual Review",
      reasoning: `${missingFields.length} mandatory field(s) are missing: ${missingFields.join(", ")}. A human adjuster must review the claim to obtain the missing information before processing can continue.`,
    };
  }

  // Estimated damage threshold
  const damage = parseFloat(extracted.estimatedDamage ?? "0");
  if (damage < 25000) {
    reasons.push(`Estimated damage of $${damage.toLocaleString()} is below the $25,000 fast-track threshold.`);
    reasons.push("All mandatory fields are present.");
    return {
      route: "Fast-track",
      reasoning: reasons.join(" ") + " This claim qualifies for expedited automated processing.",
    };
  }

  // High-value claim — manual review
  return {
    route: "Manual Review",
    reasoning: `Estimated damage of $${damage.toLocaleString()} meets or exceeds the $25,000 threshold. A senior adjuster must review and authorize settlement for high-value claims.`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { rawText, filename, claimId } = body as { rawText: string; filename?: string; claimId?: string };

    if (!rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "rawText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = extractFields(rawText);
    const missingFields = determineMissingFields(extracted);
    const { route, reasoning } = determineRoute(extracted, missingFields, rawText);

    const result = {
      extractedFields: extracted,
      missingFields,
      recommendedRoute: route,
      reasoning,
    };

    // Upsert claim record
    let savedClaimId = claimId;

    if (claimId) {
      await supabase.from("claims").update({
        status: "processed",
        raw_text: rawText,
        extracted_fields: extracted,
        missing_fields: missingFields,
        recommended_route: route,
        reasoning,
        policy_number: extracted.policyNumber ?? "",
        policyholder_name: extracted.policyholderName ?? "",
        claim_type: extracted.claimType ?? "",
        estimated_damage: parseFloat(extracted.estimatedDamage ?? "0"),
        incident_date: extracted.incidentDate ?? "",
        incident_location: extracted.incidentLocation ?? "",
      }).eq("id", claimId);
    } else {
      const { data: newClaim, error: insertError } = await supabase.from("claims").insert({
        status: "processed",
        raw_text: rawText,
        extracted_fields: extracted,
        missing_fields: missingFields,
        recommended_route: route,
        reasoning,
        policy_number: extracted.policyNumber ?? "",
        policyholder_name: extracted.policyholderName ?? "",
        claim_type: extracted.claimType ?? "",
        estimated_damage: parseFloat(extracted.estimatedDamage ?? "0"),
        incident_date: extracted.incidentDate ?? "",
        incident_location: extracted.incidentLocation ?? "",
      }).select("id").maybeSingle();

      if (insertError) throw insertError;
      savedClaimId = newClaim?.id;
    }

    // Save document
    if (filename && savedClaimId) {
      await supabase.from("claim_documents").insert({
        claim_id: savedClaimId,
        filename: filename ?? "document.txt",
        content: rawText,
      });
    }

    return new Response(
      JSON.stringify({ ...result, claimId: savedClaimId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
