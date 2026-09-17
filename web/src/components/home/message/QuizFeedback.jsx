import ReactMarkdown from "react-markdown";

const QuizFeedback = ({ feedback, correct, loading }) => {
  if (correct) {
    return (
      <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        <span>✓</span>
        <span>Correct! Well done.</span>
      </div>
    );
  }

  const parts = feedback.split("\n\n");
  const explanation = parts[2] || "";

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* Simple inline incorrect label */}
      <div className="flex items-center gap-2 text-sm font-semibold text-red-500 dark:text-red-400">
        <span>✗</span>
        <span>Incorrect Answer.</span>
      </div>

      {/* Explanation block */}
      <div className="p-3 bg-hover-bg border border-default rounded-lg">
        <div className="text-xs font-semibold text-secondary mb-1.5 tracking-wider uppercase">
          Explanation{loading ? " (fetching...)" : ""}
        </div>
        <div className="text-sm font-normal text-primary leading-relaxed">
          {loading ? (
            <div className="flex items-center gap-2 text-secondary">
              <div className="w-3.5 h-3.5 border-2 border-t-transparent border-secondary rounded-full animate-spin" />
              Generating explanation...
            </div>
          ) : (
            <ReactMarkdown>{explanation}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizFeedback;
