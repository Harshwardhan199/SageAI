import ReactMarkdown from "react-markdown";

const QuizOptions = ({
  quiz,
  state,
  quizKey,
  handleOptionChange,
  escapeMarkdown,
}) => {
  return (
    <>
      {quiz.options.map((option, index) => {
        let borderClass = "border-[#2d2d2d] bg-[#171717] text-[#e2e2e2]";

        if (state.answered) {
          if (option === quiz.answer) {
            borderClass = "border-[#10b981] bg-[#10b981]/15 text-[#10b981]";
          } else if (option === state.selectedOption) {
            borderClass = "border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444]";
          }
        } else if (state.selectedOption === option) {
          borderClass = "border-[#155dfc] bg-[#155dfc]/10 text-white";
        }

        return (
          <label
            key={index}
            className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer hover:bg-[#252525] transition-all duration-150 select-none ${borderClass}`}
          >
            <input
              type="radio"
              name={quizKey}
              value={option}
              checked={state.selectedOption === option}
              onChange={() => {
                if (!state.answered) {
                  handleOptionChange(quizKey, option);
                }
              }}
            />

            <ReactMarkdown>
              {escapeMarkdown ? escapeMarkdown(option) : option}
            </ReactMarkdown>
          </label>
        );
      })}
    </>
  );
};

export default QuizOptions;
