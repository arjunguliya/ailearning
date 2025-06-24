import { FC } from "react";

type ModelSelectorProps = {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
};

const ModelSelector: FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  const models = [
    { id: "deepseek-r1", name: "DeepSeek-R1", description: "Best for reasoning" },
    { id: "llama-3.3-70b", name: "Llama 3.3 70B", description: "Excellent general model" },
    { id: "qwen-72b", name: "Qwen 72B", description: "Great for tutoring" },
    { id: "llama-8b", name: "Llama 8B", description: "Fast responses" },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-700">AI Model:</span>
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => setSelectedModel(model.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedModel === model.id
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={model.description}
        >
          {model.name}
        </button>
      ))}
    </div>
  );
};

export default ModelSelector;
