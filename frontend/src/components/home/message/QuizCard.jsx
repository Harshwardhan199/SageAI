import { useState } from "react";
import ReactMarkdown from "react-markdown";

import CodeBlock from "./CodeBlock";
import QuizOptions from "./QuizOptions";
import QuizActions from "./QuizActions";
import QuizFeedback from "./QuizFeedback";

import { escapeMarkdown } from "./utils/markdown";
import useQuizFeedback from "./hooks/useQuizFeedback";

const QuizCard = ({
  quiz,
  questionNumber,
  language = "python",
  user,
  showCode = true,
  escapeOptions = false,
}) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState("");

  const { loading, getExplanation } = useQuizFeedback(user);

  const handleSubmit = async () => {
    if (!selectedOption) return;

    if (selectedOption === quiz.answer) {
      setAnswered(true);
      setFeedback("Correct!");
      return;
    }

    const explanation = await getExplanation(quiz, selectedOption);

    setAnswered(true);
    setFeedback(`Wrong Answer.\n\n${quiz.answer}\n\n${explanation}`);
  };

  const handleClear = () => {
    setSelectedOption("");
    setAnswered(false);
    setFeedback("");
  };

  const state = {
    selectedOption,
    answered,
    feedback,
  };

  const handleOptionChange = (_, option) => {
    setSelectedOption(option);
  };

  return (
    <div className="flex flex-col gap-3 py-4 sm:py-5 text-primary">
      <div className="text-[15px] sm:text-[17px] font-semibold tracking-wide leading-relaxed">
        <ReactMarkdown>{`Q${questionNumber}. ${quiz.question}`}</ReactMarkdown>
      </div>

      {showCode && quiz.code && (
        <CodeBlock language={language} code={quiz.code} />
      )}

      <QuizOptions
        quiz={quiz}
        state={state}
        quizKey={`quiz-${questionNumber}`}
        handleOptionChange={handleOptionChange}
        escapeMarkdown={escapeOptions ? escapeMarkdown : undefined}
      />

      {!answered ? (
        <QuizActions onSubmit={handleSubmit} onClear={handleClear} />
      ) : (
        <QuizFeedback
          feedback={feedback}
          correct={selectedOption === quiz.answer}
          loading={loading}
        />
      )}
    </div>
  );
};

export default QuizCard;
