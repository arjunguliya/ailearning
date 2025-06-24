import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";

export const maxDuration = 60;

export async function POST(request: Request) {
  let { messages } = await request.json();

  try {
    console.log("[getChat] Fetching answer stream from Together API");
    const payload = {
      model: "deepseek-ai/DeepSeek-R1",
      messages,
      stream: true,
      temperature: 0.7,        // Better for educational content
      max_tokens: 2048,        // Longer, more detailed responses
      top_p: 0.9,             // Good response diversity
      repetition_penalty: 1.1  // Reduce repetition
    };
    const stream = await TogetherAIStream(payload);

    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
      }),
    });
  } catch (e) {
    return new Response("Error. Answer stream failed.", { status: 202 });
  }
  // Add to your API routes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(messages: any[]) {
  return JSON.stringify(messages.slice(-3)); // Cache based on last 3 messages
}
}
