import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";

export const maxDuration = 60;

export async function POST(request: Request) {
  let { messages } = await request.json();

  try {
    console.log("[getChat] Using DeepSeek-R1 for educational content");
    
    const payload: TogetherAIStreamPayload = {
      model: "deepseek-ai/DeepSeek-R1", // Hardcoded to DeepSeek-R1
      messages,
      stream: true,
      // Parameters optimized for educational content
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      repetition_penalty: 1.1,
    };
    
    const stream = await TogetherAIStream(payload);

    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      }),
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    
    // Return a more user-friendly error message
    const errorResponse = {
      text: "⚠️ I'm experiencing some technical difficulties. Please try again in a moment. If the problem persists, try refreshing the page."
    };
    
    return new Response(
      `data: ${JSON.stringify(errorResponse)}\n\n`, 
      { 
        status: 200, // Return 200 to maintain streaming format
        headers: { 
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache"
        }
      }
    );
  }
}
