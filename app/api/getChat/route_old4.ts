export const maxDuration = 60;

export async function POST(request: Request) {
  console.log("🔍 [DIAGNOSTIC] POST handler called");
  console.log("🔍 [DIAGNOSTIC] Request method:", request.method);
  console.log("🔍 [DIAGNOSTIC] Request URL:", request.url);
  console.log("🔍 [DIAGNOSTIC] Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Check if request body exists
    const hasBody = request.body !== null;
    console.log("🔍 [DIAGNOSTIC] Has request body:", hasBody);

    if (!hasBody) {
      console.log("❌ [DIAGNOSTIC] No request body found");
      return new Response(
        `data: ${JSON.stringify({ text: "❌ No request body found" })}\n\n`,
        { 
          status: 200,
          headers: { "Content-Type": "text/plain" }
        }
      );
    }

    // Try to read the request body
    let requestBody;
    try {
      const bodyText = await request.text();
      console.log("🔍 [DIAGNOSTIC] Raw body text:", bodyText);
      requestBody = JSON.parse(bodyText);
      console.log("🔍 [DIAGNOSTIC] Parsed body:", requestBody);
    } catch (parseError) {
      console.error("❌ [DIAGNOSTIC] Body parsing error:", parseError);
      return new Response(
        `data: ${JSON.stringify({ text: "❌ Body parsing error: " + parseError.message })}\n\n`,
        { 
          status: 200,
          headers: { "Content-Type": "text/plain" }
        }
      );
    }

    const { messages } = requestBody;
    console.log("🔍 [DIAGNOSTIC] Messages extracted:", messages?.length || 0);

    // For now, just return a simple success response
    return new Response(
      `data: ${JSON.stringify({ 
        text: `✅ SUCCESS! Received ${messages?.length || 0} messages. Method: ${request.method}` 
      })}\n\n`,
      {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      }
    );

  } catch (error) {
    console.error("❌ [DIAGNOSTIC] Unexpected error:", error);
    return new Response(
      `data: ${JSON.stringify({ text: "❌ Unexpected error: " + error.message })}\n\n`,
      { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      }
    );
  }
}

// Log all other methods
export async function GET(request: Request) {
  console.log("❌ [DIAGNOSTIC] GET method called - this should not happen for follow-ups");
  console.log("🔍 [DIAGNOSTIC] GET Request URL:", request.url);
  return new Response("GET not allowed", { status: 405 });
}

export async function PUT(request: Request) {
  console.log("❌ [DIAGNOSTIC] PUT method called - this should not happen");
  console.log("🔍 [DIAGNOSTIC] PUT Request URL:", request.url);
  return new Response("PUT not allowed", { status: 405 });
}

export async function DELETE(request: Request) {
  console.log("❌ [DIAGNOSTIC] DELETE method called - this should not happen");
  console.log("🔍 [DIAGNOSTIC] DELETE Request URL:", request.url);
  return new Response("DELETE not allowed", { status: 405 });
}

export async function OPTIONS(request: Request) {
  console.log("🔍 [DIAGNOSTIC] OPTIONS method called");
  console.log("🔍 [DIAGNOSTIC] OPTIONS Request URL:", request.url);
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
