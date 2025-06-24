import { NextResponse } from "next/server";
import { z } from "zod";
import { retryApiCall } from "@/utils/retry";

let excludedSites = ["youtube.com", "tiktok.com", "instagram.com"];
let searchEngine: "bing" | "serper" = "serper";

export async function POST(request: Request) {
  try {
    let { question } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" }, 
        { status: 400 }
      );
    }

    const finalQuestion = `what is ${question.trim()}`;

    if (searchEngine === "bing") {
      return await handleBingSearch(finalQuestion);
    } else if (searchEngine === "serper") {
      return await handleSerperSearch(finalQuestion);
    } else {
      return NextResponse.json(
        { error: "No search engine configured" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Sources API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" }, 
      { status: 500 }
    );
  }
}

async function handleBingSearch(finalQuestion: string) {
  const BING_API_KEY = process.env["BING_API_KEY"];
  if (!BING_API_KEY) {
    throw new Error("BING_API_KEY is required");
  }

  const params = new URLSearchParams({
    q: `${finalQuestion} ${excludedSites.map((site) => `-site:${site}`).join(" ")}`,
    mkt: "en-US",
    count: "8", // Increased for better results
    safeSearch: "Strict",
  });

  const response = await retryApiCall(async () => {
    return fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": BING_API_KEY,
        },
      },
    );
  });

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
  }

  const BingJSONSchema = z.object({
    webPages: z.object({
      value: z.array(z.object({ 
        name: z.string(), 
        url: z.string(),
        snippet: z.string().optional() 
      })),
    }).optional(),
  });

  const rawJSON = await response.json();
  const data = BingJSONSchema.parse(rawJSON);

  if (!data.webPages?.value) {
    return NextResponse.json([]);
  }

  let results = data.webPages.value
    .filter(result => !excludedSites.some(site => result.url.includes(site)))
    .map((result) => ({
      name: result.name,
      url: result.url,
      snippet: result.snippet || "",
    }));

  return NextResponse.json(results);
}

async function handleSerperSearch(finalQuestion: string) {
  const SERPER_API_KEY = process.env["SERPER_API_KEY"];
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY is required");
  }

  const response = await retryApiCall(async () => {
    return fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: finalQuestion,
        num: 10, // Increased for better results
        gl: "us", // Country
        hl: "en", // Language
      }),
    });
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const rawJSON = await response.json();

  const SerperJSONSchema = z.object({
    organic: z.array(z.object({ 
      title: z.string(), 
      link: z.string(),
      snippet: z.string().optional() 
    })).optional(),
  });

  const data = SerperJSONSchema.parse(rawJSON);

  if (!data.organic) {
    return NextResponse.json([]);
  }

  let results = data.organic
    .filter(result => !excludedSites.some(site => result.link.includes(site)))
    .map((result) => ({
      name: result.title,
      url: result.link,
      snippet: result.snippet || "",
    }));

  return NextResponse.json(results);
}
