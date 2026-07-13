import { useState } from "react";
import QuizCard from "./QuizCard";

const QuizBlock = ({
  title = "Quiz",
  quizzes,
  language,
  showCode = true,
  escapeOptions = false,
  className = "flex flex-col",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleReattempt = () => {
    setAttemptCount((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col border border-default rounded-xl overflow-hidden mb-3 text-primary transition-colors bg-card-bg shadow-sm">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-hover-bg px-4 py-3 gap-3 border-b border-default">
        <div
          className="flex items-center gap-2 select-none cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Dropdown chevron button */}
          <div className="w-6 h-6 flex items-center justify-center rounded bg-card-bg border border-default hover:border-accent/50 transition-colors">
            <img
              src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
              alt="Expand"
              className="theme-icon-dark w-3 h-auto transition-transform duration-200"
              style={{
                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
          </div>
          <span className="text-[16px] sm:text-[17px] font-bold tracking-wide">
            {title}
          </span>
          <span className="text-[10px] sm:text-[12px] bg-card-bg border border-default text-secondary px-2 py-0.5 rounded-full font-semibold ml-1">
            {quizzes.length} Questions
          </span>
        </div>

        {/* Re-attempt action button */}
        <button
          onClick={handleReattempt}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
        >
          Re-attempt
        </button>
      </div>

      {/* Questions list (Collapsible Container) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-[5000px] opacity-100 px-4 sm:px-5"
            : "max-h-0 opacity-0 overflow-hidden"
        } bg-card-bg`}
      >
        <div className={className}>
          {quizzes.map((quiz, index) => (
            <div key={`${attemptCount}-${index}`}>
              <QuizCard
                quiz={quiz}
                questionNumber={index + 1}
                language={language}
                showCode={showCode}
                escapeOptions={escapeOptions}
              />
              {index < quizzes.length - 1 && (
                <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

};

export default QuizBlock;
