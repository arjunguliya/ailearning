import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";

export const maxDuration = 60;

// Add CORS headers and method handling
export async function POST(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    let { messages } = await request.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
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

    console.log("[getChat] Using DeepSeek-R1 for educational content");
    console.log("[getChat] Message count:", messages.length);
    
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
        "Content-Type": "text/plain",
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
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}

// Add explicit method handlers
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}

export async function PUT() {
  return new Response('Method not allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method not allowed', { status: 405 });
}
