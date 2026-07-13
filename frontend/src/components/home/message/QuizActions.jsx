const QuizActions = ({ onSubmit, onClear }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
      <button
        className="w-full sm:flex-1 px-6 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-200 cursor-pointer text-sm shadow-sm"
        onClick={onSubmit}
      >
        Submit Answer
      </button>

      <button
        className="w-full sm:w-auto sm:px-6 py-2 rounded-xl bg-hover-bg border border-default hover:bg-default/60 text-primary font-medium transition-all duration-200 cursor-pointer text-sm shadow-sm"
        onClick={onClear}
      >
        Clear Response
      </button>
    </div>
  );
};

export default QuizActions;
