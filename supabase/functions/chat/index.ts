import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATIENT_SYSTEM = `You are Abdulloh AI, a compassionate medical assistant for patients. 
Rules:
- Never provide definitive diagnoses. Always recommend seeing a healthcare professional.
- If symptoms suggest emergency (chest pain, difficulty breathing, severe bleeding, stroke signs), immediately advise calling emergency services.
- Express uncertainty appropriately. Use phrases like "this could be", "it's possible that".
- Flag red flags clearly with ⚠️ warnings.
- Be empathetic, clear, and use simple language.
- Always end with a recommendation to consult a doctor.
- Respond in the same language the user writes in.`;

const DOCTOR_SYSTEM = `You are Abdulloh AI, a clinical decision support system for licensed physicians.
Respond with detailed clinical analysis in markdown format including:
## Assessment (SOAP format)
## Differential Diagnosis (ranked by likelihood with percentages)
## Pathophysiology
## Recommended Workup
## Treatment Plan
## Red Flags ⚠️

Be thorough, evidence-based, and cite guidelines where relevant.
Respond in the same language the user writes in.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "patient" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = mode === "doctor" ? DOCTOR_SYSTEM : PATIENT_SYSTEM;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
