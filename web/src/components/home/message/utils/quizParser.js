import JSON5 from "json5";

// Helper function to resolve the correct answer from parsed options
function resolveAnswer(options, optionLetters, rawOptions, rawAnswer) {
  if (!rawAnswer) return options[0] || "";
  
  const cleanAnswer = rawAnswer.replace(/[\*\`_]/g, "").trim();

  // 1. Try to see if cleanAnswer is exactly one of the option letters (e.g. "B" or "b")
  const letterMatch = cleanAnswer.match(/^([A-Ea-e])(?:\s*[\).])?$/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const idx = optionLetters.indexOf(letter);
    if (idx !== -1) {
      return options[idx];
    }
  }

  // 2. Try to see if cleanAnswer starts with one of the option letters (e.g. "B) A technique...")
  const startLetterMatch = cleanAnswer.match(/^([A-Ea-e])(?:\s*[\).])\s*(.*)$/i);
  if (startLetterMatch) {
    const letter = startLetterMatch[1].toUpperCase();
    const idx = optionLetters.indexOf(letter);
    if (idx !== -1) {
      return options[idx];
    }
  }

  // 3. Try to see if cleanAnswer is exactly equal to one of the options (case-insensitive)
  const lowerAnswer = cleanAnswer.toLowerCase();
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() === lowerAnswer) {
      return options[i];
    }
  }

  // 4. Try to see if cleanAnswer is exactly equal to one of the raw option lines (case-insensitive)
  for (let i = 0; i < rawOptions.length; i++) {
    const cleanRaw = rawOptions[i].replace(/[\*\`_]/g, "").trim();
    if (cleanRaw.toLowerCase() === lowerAnswer) {
      return options[i];
    }
  }

  // 5. Check if any option is a substring of the answer or vice versa
  for (let i = 0; i < options.length; i++) {
    const optLower = options[i].toLowerCase();
    if (lowerAnswer.includes(optLower) || optLower.includes(lowerAnswer)) {
      return options[i];
    }
  }

  return options[0] || cleanAnswer;
}

// Text quiz parser state machine
export const parseTextQuiz = (content) => {
  const lines = content.split("\n");
  const quizzes = [];
  let beforeLines = [];
  let afterLines = [];
  let currentQuestion = null;
  let hasStartedQuiz = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if line is a question header
    const qMatch = line.match(/^[ \t]*(?:\*\*|\*)?(?:Question|Q|Q\.)\s*(\d+)[:.-]?\s*(?:\*\*|\*)?\s*(.*)$/i);
    const numMatch = line.match(/^[ \t]*(?:\*\*|\*)?(\d+)[:.-]\s*(?:\*\*|\*)?\s*(.*)$/);
    let isNewQuestion = false;
    let questionText = "";

    if (qMatch) {
      isNewQuestion = true;
      questionText = qMatch[2].trim();
    } else if (numMatch && parseInt(numMatch[1]) === quizzes.length + 1) {
      isNewQuestion = true;
      questionText = numMatch[2].trim();
    }

    // Check if line is an option
    const optionMatch = line.match(/^[ \t]*(?:[-*+]\s*)?(?:\*\*|\*)?([A-Ea-e])(?:\s*[\).])(?:\*\*|\*)?\s*(.+)$/);

    // Check if line is an answer
    const answerMatch = line.match(/^[ \t]*(?:\*\*|\*)?(?:Correct\s+)?Answer\s*[:\-]\s*(?:\*\*|\*)?\s*(.+)$/i);

    if (isNewQuestion) {
      hasStartedQuiz = true;
      afterLines = []; // Reset afterLines since we're still parsing questions
      if (currentQuestion) {
        // Finalize previous question if it was incomplete
        const resolved = resolveAnswer(
          currentQuestion.options,
          currentQuestion.optionLetters,
          currentQuestion.rawOptions,
          currentQuestion.rawAnswer
        );
        quizzes.push({
          question: currentQuestion.question,
          options: currentQuestion.options,
          answer: resolved
        });
      }
      currentQuestion = {
        question: questionText,
        options: [],
        optionLetters: [],
        rawOptions: [],
        rawAnswer: ""
      };
    } else if (answerMatch && currentQuestion) {
      currentQuestion.rawAnswer = answerMatch[1].trim();
      const resolved = resolveAnswer(
        currentQuestion.options,
        currentQuestion.optionLetters,
        currentQuestion.rawOptions,
        currentQuestion.rawAnswer
      );
      quizzes.push({
        question: currentQuestion.question,
        options: currentQuestion.options,
        answer: resolved
      });
      currentQuestion = null;
    } else if (optionMatch && currentQuestion) {
      currentQuestion.options.push(optionMatch[2].trim());
      currentQuestion.optionLetters.push(optionMatch[1].toUpperCase());
      currentQuestion.rawOptions.push(trimmedLine);
    } else {
      if (currentQuestion) {
        if (currentQuestion.options.length === 0) {
          if (trimmedLine) {
            currentQuestion.question += (currentQuestion.question ? "\n" : "") + trimmedLine;
          }
        } else {
          if (trimmedLine && currentQuestion.options.length > 0) {
            const lastIdx = currentQuestion.options.length - 1;
            currentQuestion.options[lastIdx] += " " + trimmedLine;
          }
        }
      } else {
        if (!hasStartedQuiz) {
          beforeLines.push(line);
        } else {
          afterLines.push(line);
        }
      }
    }
  }

  // Handle leftover question at the end
  if (currentQuestion) {
    const resolved = resolveAnswer(
      currentQuestion.options,
      currentQuestion.optionLetters,
      currentQuestion.rawOptions,
      currentQuestion.rawAnswer
    );
    quizzes.push({
      question: currentQuestion.question,
      options: currentQuestion.options,
      answer: resolved
    });
  }

  if (quizzes.length > 0) {
    return {
      quiz: quizzes,
      before: beforeLines.join("\n").trim(),
      after: afterLines.join("\n").trim()
    };
  }

  return null;
};

export const extractQuiz = (content) => {
  const jsonRegex = /\[(?:\s*\{[\s\S]*?\}\s*,?)*\s*\]/m;
  const match = content.match(jsonRegex);

  if (!match) {
    return parseTextQuiz(content);
  }

  try {
    const parsed = JSON5.parse(match[0].replace(/`/g, ""));

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed[0].question &&
      parsed[0].options &&
      parsed[0].answer
    ) {
      return {
        quiz: parsed,
        before: content.slice(0, match.index).trim(),
        after: content
          .slice(match.index + match[0].length)
          .trim(),
      };
    }
  } catch (err) {
    console.error("JSON.parse failed:", err, match[0]);
  }

  return parseTextQuiz(content);
};