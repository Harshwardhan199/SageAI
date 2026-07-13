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
        let borderClass = "";

        if (state.answered) {
          if (option === quiz.answer) {
            borderClass = "border border-[#006610]";
          } else if (option === state.selectedOption) {
            borderClass = "border border-[#600000]";
          }
        } else if (state.selectedOption === option) {
          borderClass = "border border-[#404040]";
        }

        return (
          <label
            key={index}
            className={`flex gap-2 p-2 rounded-sm border border-[#1c1c1c] ${borderClass}`}
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
