import { useState } from "react";
import QuizCard from "./QuizCard";

const QuizBlock = ({
  title = "Quiz",
  quizzes,
  language,
  showCode = true,
  escapeOptions = false,
  className = "flex flex-col gap-4",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleReattempt = () => {
    setAttemptCount((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col border border-[#2e2e2e] rounded-xl bg-[#1a1a1a] overflow-hidden mb-3">
      {/* Quiz Header */}
      <div className="flex items-center justify-between bg-[#111111] px-4 py-3 border-b border-[#2e2e2e]">
        <div
          className="flex items-center gap-2 select-none cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Dropdown chevron button */}
          <div className="w-6 h-6 flex items-center justify-center rounded bg-[#222] hover:bg-[#2e2e2e] transition-colors">
            <img
              src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
              alt="Expand"
              className="invert w-3 h-auto transition-transform duration-200"
              style={{
                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
          </div>
          <span className="text-[17px] font-bold text-white tracking-wide">
            {title}
          </span>
          <span className="text-[12px] bg-[#2e2e2e] text-[#b0b0b0] px-2 py-0.5 rounded-full font-medium ml-1">
            {quizzes.length} Questions
          </span>
        </div>

        {/* Re-attempt action button */}
        <button
          onClick={handleReattempt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#155dfc] hover:bg-[#134bc4] text-white text-s font-semibold tracking-wide transition-all duration-200 shadow-md active:scale-95"
        >
          Re-attempt
        </button>
      </div>

      {/* Questions list (Collapsible Container) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-[5000px] opacity-100 p-4 border-t border-[#2e2e2e]"
            : "max-h-0 opacity-0 overflow-hidden"
        } bg-[#161616]`}
      >
        <div className={className}>
          {quizzes.map((quiz, index) => (
            <QuizCard
              key={`${attemptCount}-${index}`}
              quiz={quiz}
              questionNumber={index + 1}
              language={language}
              showCode={showCode}
              escapeOptions={escapeOptions}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizBlock;
