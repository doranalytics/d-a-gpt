import { supabaseAdmin } from "@/utils";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, matches } = (await req.json()) as {
      query: string;
      matches: number;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("API key is not set in the environment variables");
      return new Response("Internal Server Error", { status: 500 });
    }
    const input = query.replace(/\n/g, " ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input
      })
    });

    if (!res.ok) {
      console.error("Error response from OpenAI API:", res.status, await res.text());
      return new Response("Error in OpenAI request", { status: res.status });
    }

    const json = await res.json();
    const embedding = json.data[0].embedding;

    const { data: chunks, error } = await supabaseAdmin.rpc("pg_search", {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches
    });

    if (error) {
      console.error("Error in Supabase RPC call:", error);
      return new Response("Error in Supabase call", { status: 500 });
    }

    return new Response(JSON.stringify(chunks), { status: 200 });
  } catch (error) {
    console.error("Unexpected error in handler:", error);
    return new Response("Unexpected server error", { status: 500 });
  }
};

export default handler;
