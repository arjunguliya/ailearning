import { FC } from "react";

type ModelSelectorProps = {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  disabled?: boolean;
};

const ModelSelector: FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
  disabled = false,
}) => {
  const models = [
    { 
      id: "auto", 
      name: "Auto Select", 
      description: "Automatically choose the best model for your query",
      cost: "Optimized",
      icon: "🤖"
    },
    { 
      id: "deepseek-r1", 
      name: "DeepSeek R1", 
      description: "Best for reasoning and complex explanations",
      cost: "$0.14/1M tokens",
      icon: "🧠"
    },
    { 
      id: "llama-3.3-70b", 
      name: "Llama 3.3 70B", 
      description: "Excellent general-purpose education model",
      cost: "$0.90/1M tokens",
      icon: "🦙"
    },
    { 
      id: "qwen-72b", 
      name: "Qwen 72B", 
      description: "Great for tutoring and detailed explanations",
      cost: "$0.60/1M tokens",
      icon: "📚"
    },
    { 
      id: "llama-8b", 
      name: "Llama 8B", 
      description: "Fast responses for simple queries",
      cost: "$0.20/1M tokens",
      icon: "⚡"
    },
  ];

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">AI Model:</span>
        <span className="text-xs text-gray-500">Choose based on your needs</span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => !disabled && setSelectedModel(model.id)}
            disabled={disabled}
            className={`group relative rounded-lg border-2 p-3 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedModel === model.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
            title={model.description}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{model.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${
                    selectedModel === model.id ? "text-blue-700" : "text-gray-700"
                  }`}>
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-500">{model.cost}</div>
                </div>
              </div>
              
              {selectedModel === model.id && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
              )}
            </div>
            
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {model.description}
            </p>
            
            {/* Hover tooltip for desktop */}
            <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
              {model.description}
              <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-800"></div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        💡 <strong>Auto Select</strong> will choose the best model based on your query complexity and education level.
      </div>
    </div>
  );
};

export default ModelSelector;
