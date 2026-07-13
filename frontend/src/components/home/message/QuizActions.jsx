const QuizActions = ({ onSubmit, onClear }) => {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-700/50">
      <button
        className="flex-1 px-6 py-2 rounded-xl bg-[#155dfc] hover:bg-[#134bc4] text-white font-medium transition-colors duration-200"
        onClick={onSubmit}
      >
        Submit Answer
      </button>

      <button
        className="w-[30%] px-6 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200 shadow-lg"
        onClick={onClear}
      >
        Clear Response
      </button>
    </div>
  );
};

export default QuizActions;
