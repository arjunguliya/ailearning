"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
import ModelSelector from "@/components/ModelSelector";
import { useState } from "react";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { getSystemPrompt } from "@/utils/utils";
import { retryApiCall, sourcesCache, generateCacheKey } from "@/utils/retry";
import Chat from "@/components/Chat";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [topic, setTopic] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [sources, setSources] = useState<{ name: string; url: string }[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [ageGroup, setAgeGroup] = useState("Middle School");
  const [selectedModel, setSelectedModel] = useState("auto"); // New state for model selection

  const handleInitialChat = async () => {
    setShowResult(true);
    setLoading(true);
    setTopic(inputValue);
    setInputValue("");

    await handleSourcesAndChat(inputValue);

    setLoading(false);
  };

  const handleChat = async (messages?: { role: string; content: string }[]) => {
    setLoading(true);
    
    try {
      const chatRes = await retryApiCall(async () => {
        return fetch("/api/getChat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            messages, 
            model: selectedModel === "auto" ? undefined : selectedModel,
            ageGroup: ageGroup
          }),
        });
      });

      if (!chatRes.ok) {
        throw new Error(chatRes.statusText);
      }

      // This data is a ReadableStream
      const data = chatRes.body;
      if (!data) {
        return;
      }
      let fullAnswer = "";

      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          try {
            const text = JSON.parse(data).text ?? "";
            fullAnswer += text;
            // Update messages with each chunk
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + text },
                ];
              } else {
                return [...prev, { role: "assistant", content: text }];
              }
            });
          } catch (e) {
            console.error(e);
          }
        }
      };

      // https://web.dev/streams/#the-getreader-and-read-methods
      const reader = data.getReader();
      const decoder = new TextDecoder();
      const parser = createParser(onParse);
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        parser.feed(chunkValue);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "⚠️ I'm experiencing some technical difficulties. Please try again in a moment." 
        }
      ]);
    }
    
    setLoading(false);
  };

  async function handleSourcesAndChat(question: string) {
    setIsLoadingSources(true);
    
    // Check cache first
    const cacheKey = generateCacheKey(question);
    const cachedSources = sourcesCache.get(cacheKey);
    
    let sources;
    if (cachedSources) {
      console.log("Using cached sources");
      sources = cachedSources;
      setSources(sources);
      setIsLoadingSources(false);
    } else {
      try {
        const sourcesResponse = await retryApiCall(async () => {
          return fetch("/api/getSources", {
            method: "POST",
            body: JSON.stringify({ question }),
          });
        });

        if (sourcesResponse.ok) {
          sources = await sourcesResponse.json();
          // Cache the sources
          sourcesCache.set(cacheKey, sources);
          setSources(sources);
        } else {
          sources = [];
          setSources([]);
        }
      } catch (error) {
        console.error("Sources error:", error);
        sources = [];
        setSources([]);
      }
      setIsLoadingSources(false);
    }

    try {
      const parsedSourcesRes = await retryApiCall(async () => {
        return fetch("/api/getParsedSources", {
          method: "POST",
          body: JSON.stringify({ sources }),
        });
      });

      let parsedSources;
      if (parsedSourcesRes.ok) {
        parsedSources = await parsedSourcesRes.json();
      }

      const initialMessage = [
        { role: "system", content: getSystemPrompt(parsedSources, ageGroup) },
        { role: "user", content: `${question}` },
      ];
      setMessages(initialMessage);
      await handleChat(initialMessage);
    } catch (error) {
      console.error("Parsed sources error:", error);
      // Continue anyway with empty sources
      const initialMessage = [
        { role: "system", content: getSystemPrompt([], ageGroup) },
        { role: "user", content: `${question}` },
      ];
      setMessages(initialMessage);
      await handleChat(initialMessage);
    }
  }

  return (
    <>
      <Header />

      <main
        className={`flex grow flex-col px-4 pb-4 ${showResult ? "overflow-hidden" : ""}`}
      >
        {showResult ? (
          <div className="mt-2 flex w-full grow flex-col justify-between overflow-hidden">
            {/* Model Selector - Show when results are displayed */}
            <div className="mx-auto w-full max-w-7xl">
              <ModelSelector
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                disabled={loading}
              />
            </div>
            
            <div className="flex w-full grow flex-col space-y-2 overflow-hidden">
              <div className="mx-auto flex w-full max-w-7xl grow flex-col gap-4 overflow-hidden lg:flex-row lg:gap-10">
                <Chat
                  messages={messages}
                  disabled={loading}
                  promptValue={inputValue}
                  setPromptValue={setInputValue}
                  setMessages={setMessages}
                  handleChat={handleChat}
                  topic={topic}
                />
                <Sources sources={sources} isLoading={isLoadingSources} />
              </div>
            </div>
          </div>
        ) : (
          <Hero
            promptValue={inputValue}
            setPromptValue={setInputValue}
            handleChat={handleChat}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
            handleInitialChat={handleInitialChat}
          />
        )}
      </main>
      {/* <Footer /> */}
    </>
  );
}
