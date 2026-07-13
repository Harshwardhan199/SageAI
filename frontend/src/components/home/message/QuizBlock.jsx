import QuizCard from "./QuizCard";

const QuizBlock = ({
  quizzes,
  language,
  showCode = true,
  escapeOptions = false,
  className = "flex flex-col gap-4",
}) => {
  return (
    <div className={className}>
      {quizzes.map((quiz, index) => (
        <QuizCard
          key={index}
          quiz={quiz}
          questionNumber={index + 1}
          language={language}
          showCode={showCode}
          escapeOptions={escapeOptions}
        />
      ))}
    </div>
  );
};

export default QuizBlock;
