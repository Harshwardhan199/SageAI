import ReactMarkdown from "react-markdown";

const QuizFeedback = ({ feedback, correct, loading }) => {
  if (correct) {
    return (
      <div className="font-medium mt-2 p-3 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-lg flex items-center gap-2">
        <span className="text-lg">✓</span> Correct! Well done.
      </div>
    );
  }

  const parts = feedback.split("\n\n");
  const explanation = parts[2] || "";

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="font-medium p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg flex items-center gap-2">
        <span className="text-lg">✗</span> Incorrect Answer.
      </div>

      <div className="mt-2 p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg">
        <div className="text-sm font-semibold text-[#b0b0b0] mb-1.5 tracking-wider uppercase">
          Explanation{loading ? " (fetching details...)" : ""}
        </div>
        <div className="text-[15px] font-normal text-[#e2e2e2] leading-relaxed">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
              Generating detailed explanation...
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
