import ReactMarkdown from "react-markdown";

const QuizFeedback = ({ feedback, correct, loading }) => {
  if (correct) {
    return <div className="font-medium mt-2 p-2 rounded-lg">{feedback}</div>;
  }

  const parts = feedback.split("\n\n");

  const explanation = parts[2] || "";

  return (
    <div className="font-medium mt-2 p-2 rounded-lg">
      <div className="mt-3 mb-1 text-[17px]">
        Explanation{loading ? "..." : ":"}{" "}
        <span className="font-normal">{explanation}</span>
      </div>
    </div>
  );
};

export default QuizFeedback;
