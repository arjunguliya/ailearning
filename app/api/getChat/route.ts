import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log("[getChat] POST request received");
    
    const requestBody = await request.json();
    const { messages } = requestBody;

    if (!messages || !Array.isArray(messages)) {
      console.error("[getChat] Invalid messages format:", messages);
      return new Response(
        `data: ${JSON.stringify({ text: "⚠️ Invalid request format." })}\n\n`,
        { 
          status: 200,
          headers: { 
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache"
          }
        }
      );
    }

    console.log("[getChat] Using Llama 3.1 70B for educational content");
    console.log("[getChat] Message count:", messages.length);
    
    const payload: TogetherAIStreamPayload = {
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", // Switch from DeepSeek-R1
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      repetition_penalty: 1.1,
    };
    
    console.log("[getChat] Calling TogetherAIStream...");
    const stream = await TogetherAIStream(payload);
    console.log("[getChat] Stream created successfully");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[getChat] Error in POST handler:", error);
    
    const errorResponse = {
      text: "⚠️ I'm experiencing some technical difficulties. Please try again in a moment."
    };
    
    return new Response(
      `data: ${JSON.stringify(errorResponse)}\n\n`, 
      { 
        status: 200,
        headers: { 
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache"
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
