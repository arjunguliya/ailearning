import { Readability } from "@mozilla/readability";
import jsdom, { JSDOM } from "jsdom";
import { cleanedText, fetchWithTimeout } from "@/utils/utils";
import { retryApiCall } from "@/utils/retry";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    let { sources } = await request.json();

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: "Sources array is required" }, 
        { status: 400 }
      );
    }

    console.log(`[getParsedSources] Processing ${sources.length} sources`);
    
    // Limit to 5 sources for performance and cost optimization
    const limitedSources = sources.slice(0, 5);
    
    let finalResults = await Promise.allSettled(
      limitedSources.map(async (result: any) => {
        return await retryApiCall(async () => {
          try {
            // Fetch the source URL with timeout
            const response = await fetchWithTimeout(result.url, {}, 5000); // 5 second timeout
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            const virtualConsole = new jsdom.VirtualConsole();
            
            // Suppress console output from JSDOM
            virtualConsole.on("error", () => {});
            virtualConsole.on("warn", () => {});
            
            const dom = new JSDOM(html, { virtualConsole });
            const doc = dom.window.document;
            
            const parsed = new Readability(doc).parse();
            let parsedContent = parsed
              ? cleanedText(parsed.textContent)
              : "Content not available";

            // Add some metadata for better context
            const title = doc.title || result.name || "Unknown";
            const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || "";
            
            return {
              ...result,
              fullContent: `Title: ${title}\n\n${description ? `Description: ${description}\n\n` : ""}Content: ${parsedContent}`,
              title: title,
              description: description,
              status: "success",
            };
          } catch (e) {
            console.log(`Error parsing ${result.name}: ${e}`);
            return {
              ...result,
              fullContent: `Title: ${result.name}\n\nContent: Unable to access this source. This may be due to access restrictions or temporary unavailability.`,
              title: result.name,
              description: "",
              status: "error",
              error: e instanceof Error ? e.message : "Unknown error",
            };
          }
        });
      }),
    );

    // Process results and separate successful from failed
    const processedResults = finalResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Failed to process source ${index}:`, result.reason);
        return {
          ...limitedSources[index],
          fullContent: `Title: ${limitedSources[index].name}\n\nContent: This source could not be processed due to technical difficulties.`,
          title: limitedSources[index].name,
          description: "",
          status: "error",
          error: result.reason instanceof Error ? result.reason.message : "Processing failed",
        };
      }
    });

    // Filter out completely failed results but keep at least one
    const validResults = processedResults.filter(result => 
      result.fullContent.length > 50 && result.status !== "error"
    );
    
    const finalOutput = validResults.length > 0 ? validResults : processedResults.slice(0, 1);
    
    console.log(`[getParsedSources] Successfully processed ${validResults.length}/${limitedSources.length} sources`);
    
    return NextResponse.json(finalOutput);
    
  } catch (error) {
    console.error("Parsed Sources API Error:", error);
    return NextResponse.json(
      { error: "Failed to parse sources" }, 
      { status: 500 }
    );
  }
}
