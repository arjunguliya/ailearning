import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

export type ChatGPTAgent = "user" | "system" | "assistant";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface TogetherAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  repetition_penalty?: number;
}

export async function TogetherAIStream(payload: TogetherAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Enhance payload with optimal parameters for educational content
  const optimizedPayload = {
    ...payload,
    temperature: payload.temperature || 0.7, // Good balance for educational content
    max_tokens: payload.max_tokens || 2048, // Longer responses for detailed explanations
    top_p: payload.top_p || 0.9, // Good diversity in responses
    repetition_penalty: payload.repetition_penalty || 1.1, // Reduce repetition
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
  };

  // Add Helicone headers if API key is provided
  if (process.env.HELICONE_API_KEY) {
    headers["Helicone-Auth"] = `Bearer ${process.env.HELICONE_API_KEY}`;
  }

  const baseURL = process.env.HELICONE_API_KEY 
    ? "https://together.helicone.ai/v1"
    : "https://api.together.xyz/v1";

  const res = await fetch(`${baseURL}/chat/completions`, {
    headers,
    method: "POST",
    body: JSON.stringify(optimizedPayload),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          controller.enqueue(encoder.encode(data));
        }
      };

      // Enhanced error handling
      if (res.status !== 200) {
        const errorData = {
          status: res.status,
          statusText: res.statusText,
          body: await res.text(),
        };
        console.error(`Together AI API Error:`, errorData);
        
        // Provide more specific error messages
        let errorMessage = "AI service temporarily unavailable.";
        if (res.status === 401) {
          errorMessage = "Authentication failed. Please check your API key.";
        } else if (res.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (res.status === 500) {
          errorMessage = "Server error. Please try again.";
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          text: `⚠️ ${errorMessage}` 
        })}\n\n`));
        controller.close();
        return;
      }

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  let counter = 0;
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const data = decoder.decode(chunk);
      
      if (data === "[DONE]") {
        controller.terminate();
        return;
      }
      
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].delta?.content || "";
        
        if (counter < 2 && (text.match(/\n/) || []).length) {
          return;
        }
        
        const payload = { text: text };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
        counter++;
      } catch (e) {
        console.error("Stream parsing error:", e);
        controller.error(e);
      }
    },
  });

  return readableStream.pipeThrough(transformStream);
}
