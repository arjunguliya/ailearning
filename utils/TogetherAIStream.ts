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

  // Use Llama instead of DeepSeek-R1 to avoid rate limits
  const optimizedPayload = {
    ...payload,
    model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", // Better rate limits
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    repetition_penalty: 1.1,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
  };

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

      // Enhanced error handling for rate limits
      if (res.status !== 200) {
        const errorData = {
          status: res.status,
          statusText: res.statusText,
          body: await res.text(),
        };
        console.error(`Together AI API Error:`, errorData);
        
        let errorMessage = "AI service temporarily unavailable.";
        if (res.status === 401) {
          errorMessage = "Authentication failed. Please check your API key.";
        } else if (res.status === 429) {
          errorMessage = "Too many requests. Please wait a moment before trying again.";
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
  let textBuffer = "";
  
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
        
        // Simple approach: just pass through the text without think tag filtering for now
        // This avoids the JSON parsing errors
        if (text) {
          textBuffer += text;
          
          // Simple filter: remove content between <think> and </think>
          let filteredText = textBuffer;
          const thinkRegex = /<think>[\s\S]*?<\/think>/g;
          filteredText = filteredText.replace(thinkRegex, '');
          
          // Only send if we have new content
          if (filteredText !== textBuffer.replace(thinkRegex, '')) {
            const payload = { text: filteredText };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
            textBuffer = ""; // Reset buffer
          } else if (text && !text.includes('<think>') && !text.includes('</think>')) {
            // Send text that doesn't contain think tags immediately
            const payload = { text: text };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
          }
        }
        
        counter++;
      } catch (e) {
        console.error("Stream parsing error:", e);
        // Don't re-throw, just log and continue
      }
    },
  });

  return readableStream.pipeThrough(transformStream);
}
