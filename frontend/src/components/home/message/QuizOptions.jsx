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
        let borderClass = "border-default bg-hover-bg text-primary";

        if (state.answered) {
          if (option === quiz.answer) {
            borderClass = "border-emerald-500/70 bg-hover-bg text-emerald-600 dark:text-emerald-400 font-semibold";
          } else if (option === state.selectedOption) {
            borderClass = "border-red-500/70 bg-hover-bg text-red-600 dark:text-red-400 font-semibold";
          } else {
            borderClass = "border-default/50 bg-hover-bg text-secondary opacity-60";
          }
        } else if (state.selectedOption === option) {
          borderClass = "border-accent bg-accent/10 text-primary font-semibold";
        }

        return (
          <label
            key={index}
            className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer hover:bg-hover-bg transition-all duration-150 select-none ${borderClass}`}
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
