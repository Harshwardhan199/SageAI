import { useState } from "react";
import axios from "axios";

import api from "../../../../api/axios";
import { config } from "../../../../config";

export default function useQuizFeedback(user) {
  const [loading, setLoading] = useState(false);

  const getExplanation = async (quiz, selectedOption) => {
    if (selectedOption === quiz.answer) {
      return "";
    }

    const prompt = `
Question: ${quiz.question},
Options: ${quiz.options},
Correct answer: ${quiz.answer},
User's Answer: ${selectedOption}
`;

    setLoading(true);

    try {
      let res;

      if (user) {
        res = await api.post(
          "/user/feedback",
          { prompt },
          { withCredentials: true }
        );
      } else {
        res = await axios.post(
          `${config.BACKEND_URL}/api/temp/feedback`,
          { prompt }
        );
      }

      return res.data.llmResponse || "";
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getExplanation,
  };
}