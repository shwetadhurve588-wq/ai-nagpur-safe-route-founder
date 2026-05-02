import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Nagpur SmartRoute AI Assistant, an expert navigation helper for Nagpur, India. You help citizens find the fastest and safest routes by avoiding metro construction zones and traffic disruptions.

Key knowledge about Nagpur:
- Nagpur Metro Phase-2 construction is ongoing with major zones at Sitabuldi, Wardha Road, Dharampeth, MIHAN, Airport, Pardi, and Besa
- Common traffic hotspots: LIC Chowk, Medical Square, Ajni Square, Ramdaspeth, Ravi Nagar
- Major roads: Wardha Road (NH-44), Central Avenue, Amravati Road, Hingna Road, Kamptee Road, Manewada Road
- Key areas: Sitabuldi (city center), Civil Lines, Dharampeth, Gandhibagh, Mahal (old city), MIHAN SEZ

When users ask about routes:
1. Suggest specific roads and landmarks
2. Mention which construction zones or disruptions to avoid
3. Provide estimated travel times considering traffic
4. Recommend alternative routes when possible

Keep responses concise (2-4 sentences). Be helpful and specific to Nagpur. If asked about unrelated topics, politely redirect to navigation help.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contents = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ reply: text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
