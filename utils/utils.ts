// import llama3Tokenizer from "llama3-tokenizer-js";

export const cleanedText = (text: string) => {
  let newText = text
    .trim()
    .replace(/(\n){4,}/g, "\n\n\n")
    .replace(/\n\n/g, " ")
    .replace(/ {3,}/g, "  ")
    .replace(/\t/g, "")
    .replace(/\n+(\s*\n)*/g, "\n")
    .substring(0, 100000);

  // console.log(llama3Tokenizer.encode(newText).length);

  return newText;
};

export async function fetchWithTimeout(
  url: string,
  options = {},
  timeout = 3000,
) {
  // Create an AbortController
  const controller = new AbortController();
  const { signal } = controller;

  // Set a timeout to abort the fetch
  const fetchTimeout = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Start the fetch request with the abort signal
  return fetch(url, { ...options, signal })
    .then((response) => {
      clearTimeout(fetchTimeout); // Clear the timeout if the fetch completes in time
      return response;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        throw new Error("Fetch request timed out");
      }
      throw error; // Re-throw other errors
    });
}

type suggestionType = {
  id: number;
  name: string;
  icon: string;
};

// Enhanced suggestions for better educational topics
export const suggestions: suggestionType[] = [
  {
    id: 1,
    name: "Quantum Physics Basics",
    icon: "/basketball-new.svg", // You can update these icons later
  },
  {
    id: 2,
    name: "Climate Change Science",
    icon: "/light-new.svg",
  },
  {
    id: 3,
    name: "Financial Literacy",
    icon: "/finance.svg",
  },
];

export const getSystemPrompt = (
  finalResults: { fullContent: string }[],
  ageGroup: string,
) => {
  const ageInstructions = {
    "Elementary School": "Use simple words, short sentences, and fun examples. Explain things like you're talking to a curious 6-10 year old. Use analogies to everyday objects and experiences.",
    "Middle School": "Use clear explanations with examples from daily life. Connect concepts to things an 11-13 year old would understand. Include some basic terminology but always explain it.",
    "High School": "Use proper terminology but explain concepts clearly. Include relevant real-world applications and examples. Encourage critical thinking and connections between ideas.",
    "College": "Use academic language and provide in-depth explanations. Include multiple perspectives, theoretical frameworks, and practical applications. Encourage analysis and synthesis.",
    "Undergrad": "Provide comprehensive analysis with theoretical foundations and research-based insights. Include interdisciplinary connections and prepare for advanced study.",
    "Graduate": "Use advanced terminology, research-based insights, and complex analytical frameworks. Focus on critical evaluation, original thinking, and scholarly discourse."
  };

  const currentInstruction = ageInstructions[ageGroup as keyof typeof ageInstructions] || ageInstructions["Middle School"];

  return `You are an expert interactive tutor who specializes in personalized education. Your mission is to make learning engaging, clear, and memorable.

🎯 TEACHING LEVEL: ${ageGroup}
📚 INSTRUCTION STYLE: ${currentInstruction}

🏆 YOUR TEACHING APPROACH:
1. **Welcome & Overview**: Start with a warm greeting and give a brief, exciting overview of the topic
2. **Learning Path**: Ask what specific aspect they want to explore (provide 3-4 numbered options)
3. **Bite-sized Teaching**: Break complex topics into digestible chunks with clear examples
4. **Check Understanding**: Use engaging questions to ensure comprehension (but not immediately after introduction)
5. **Interactive Dialog**: Encourage questions and maintain a conversational flow
6. **Real-world Connections**: Always connect concepts to practical applications and everyday life
7. **Celebrate Progress**: Acknowledge understanding and encourage continued learning

📖 RELIABLE INFORMATION SOURCES:
${finalResults
  .slice(0, 7)
  .map((result, index) => `📄 Source ${index + 1}: ${result.fullContent.substring(0, 800)}...`)
  .join('\n\n')}

✨ TEACHING GUIDELINES:
- Keep your first message concise, welcoming, and engaging
- Use markdown formatting (headers, bullet points, **bold**) for clarity
- Adapt vocabulary and complexity to the specified education level
- Make learning feel like a friendly conversation, not a lecture
- Focus on understanding and application, not just memorization
- Use analogies, examples, and stories to illustrate concepts
- Be encouraging and supportive throughout the learning journey

🚀 READY TO TEACH! Here's the topic to explore:`;
};

// Utility function to get age-appropriate complexity level
export const getComplexityLevel = (ageGroup: string): 'simple' | 'moderate' | 'advanced' => {
  const simpleGroups = ['Elementary School', 'Middle School'];
  const advancedGroups = ['College', 'Undergrad', 'Graduate'];
  
  if (simpleGroups.includes(ageGroup)) return 'simple';
  if (advancedGroups.includes(ageGroup)) return 'advanced';
  return 'moderate';
};

// Utility function to format educational content
export const formatEducationalContent = (content: string, ageGroup: string): string => {
  const complexity = getComplexityLevel(ageGroup);
  
  // Add age-appropriate formatting hints
  if (complexity === 'simple') {
    return content + "\n\n💡 **Remember**: Feel free to ask if anything is confusing - learning should be fun!";
  } else if (complexity === 'advanced') {
    return content + "\n\n🎓 **For deeper learning**: Consider exploring the research sources and related academic papers.";
  } else {
    return content + "\n\n🤔 **Think about it**: How might this concept apply to situations in your own life?";
  }
};
