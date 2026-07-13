import ReactMarkdown from "react-markdown";

const QuizFeedback = ({ feedback, correct, loading }) => {
  if (correct) {
    return (
      <div className="font-medium mt-2 p-2 rounded-lg bg-[#2c2c2c]">
        {feedback}
      </div>
    );
  }

  const parts = feedback.split("\n\n");

  const main = parts[0] || "";
  const answer = parts[1] || "";
  const explanation = parts[2] || "";

  return (
    <div className="font-medium mt-2 p-2 rounded-lg bg-[#2c2c2c]">
      <div className="mb-1">{main}</div>

      <div className="mb-1">
        Correct: <span className="font-normal">{answer}</span>
      </div>

      <div className="mb-1 text-[17px]">Explanation{loading ? "..." : ":"}</div>

      {explanation && (
        <div className="font-normal">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default QuizFeedback;
