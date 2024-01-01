import { OpenAIStream } from "@/utils";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { prompt } = (await req.json()) as {
      prompt: string;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("API key is not set in the environment variables");
      return new Response("Internal Server Error", { status: 500 });
    }
    
    const stream = await OpenAIStream(prompt, apiKey);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;