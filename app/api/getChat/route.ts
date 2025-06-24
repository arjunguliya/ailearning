import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log("[getChat] POST request received");
    
    const requestBody = await request.json();
    console.log("[getChat] Request body:", JSON.stringify(requestBody, null, 2));
    
    const { messages } = requestBody;

    // Validate messages
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

    console.log("[getChat] Using DeepSeek-R1 for educational content");
    console.log("[getChat] Message count:", messages.length);
    
    // Log each message for debugging
    messages.forEach((msg, index) => {
      console.log(`[getChat] Message ${index}:`, msg.role, msg.content.substring(0, 100) + "...");
    });
    
    const payload: TogetherAIStreamPayload = {
      model: "deepseek-ai/DeepSeek-R1",
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

// Explicitly handle other methods
export async function GET() {
  console.log("[getChat] GET request received - not allowed");
  return new Response(JSON.stringify({ error: "Method GET not allowed" }), { 
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Allow": "POST"
    }
  });
}

export async function PUT() {
  console.log("[getChat] PUT request received - not allowed");
  return new Response(JSON.stringify({ error: "Method PUT not allowed" }), { 
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Allow": "POST"
    }
  });
}

export async function DELETE() {
  console.log("[getChat] DELETE request received - not allowed");
  return new Response(JSON.stringify({ error: "Method DELETE not allowed" }), { 
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Allow": "POST"
    }
  });
}

export async function OPTIONS() {
  console.log("[getChat] OPTIONS request received");
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
