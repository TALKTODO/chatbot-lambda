const { CONSTANTS, MESSAGES } = require("./constants");
const {
  getTodayDate,
  createResponse,
  createPlainTextMessage,
  createCustomPayloadMessage,
  createErrorResponse,
} = require("./utils");
const { callGPT, parseJSONResponse } = require("./gpt");

// 날짜 보완 처리 함수
const handleDateCompletion = async (intent, task, rawDate) => {
  const todayDate = getTodayDate();
  const fillPrompt = `
다음 할 일과 날짜를 기반으로 아래 형식으로 JSON 배열 하나를 만들어줘:
형식: [{ "task": "", "date": "" }]
task: "${task}"
date: "${rawDate}"
- 날짜는 반드시 YYYY-MM-DD 형식으로 만들어줘
- "오늘", "내일", "이번 주말", "3일 뒤", "2주 뒤" 같은 표현은 현재 날짜(${todayDate}) 기준으로 계산해서 날짜로 바꿔줘
  `;

  const systemPrompt = "반드시 JSON 배열 하나로만 응답해. 설명 금지!";
  const content = await callGPT(systemPrompt, fillPrompt);
  const updatedTodos = parseJSONResponse(content, MESSAGES.DATE_NOT_UNDERSTOOD);

  return createResponse(
    intent.name,
    CONSTANTS.INTENT_STATE.FULFILLED,
    CONSTANTS.DIALOG_ACTION.CLOSE,
    [
      createPlainTextMessage(MESSAGES.DATE_SET(task, updatedTodos[0].date)),
      createCustomPayloadMessage(updatedTodos),
    ]
  );
};

// 자연어 분석 처리 함수
const analyzeNaturalLanguage = async (intent, userInput) => {
  if (!userInput) {
    throw new Error("Lex에서 전달된 입력이 없습니다.");
  }

  const todayDate = getTodayDate();
  const prompt = `
사용자의 입력 문장에서 해야 할 일(Todo)을 추출해줘.
형식: [{ "task": "", "date": "" }]
- 날짜가 명확하면 날짜로 (예: 2025-07-25)
- "오늘", "내일", "이번 주말", "3일 뒤", "2주 뒤" 같은 표현은 현재 날짜(${todayDate}) 기준으로 계산해서 날짜로 바꿔줘
- 날짜가 전혀 없으면 "날짜 없음"으로 표시해줘

입력 문장:
${userInput}
`;

  const systemPrompt =
    "너는 사용자의 자연어에서 할 일을 뽑아주는 비서야. 반드시 JSON 배열로만 응답해. 설명 없이!";
  const content = await callGPT(systemPrompt, prompt);
  const todos = parseJSONResponse(content, MESSAGES.INPUT_NOT_UNDERSTOOD);

  if (!todos || todos.length === 0) {
    return createErrorResponse(intent.name, MESSAGES.NO_TODOS);
  }

  // 날짜가 없는 항목이 있는지 확인
  const todosWithoutDate = todos.filter(
    (t) => t.date === CONSTANTS.DATE_PLACEHOLDER
  );

  if (todosWithoutDate.length > 0) {
    const firstMissing = todosWithoutDate[0];
    return createResponse(
      intent.name,
      CONSTANTS.INTENT_STATE.IN_PROGRESS,
      CONSTANTS.DIALOG_ACTION.ELICIT_SLOT,
      [createPlainTextMessage(MESSAGES.DATE_REQUEST(firstMissing.task))],
      {
        slots: {
          [CONSTANTS.SLOT_NAMES.MISSING_DATE]: null,
          [CONSTANTS.SLOT_NAMES.TASK_TEXT]: {
            value: {
              originalValue: firstMissing.task,
              interpretedValue: firstMissing.task,
              resolvedValues: [firstMissing.task],
            },
          },
        },
      }
    );
  }

  // 모두 날짜가 있는 경우
  return createResponse(
    intent.name,
    CONSTANTS.INTENT_STATE.FULFILLED,
    CONSTANTS.DIALOG_ACTION.CLOSE,
    [
      createPlainTextMessage(MESSAGES.TODOS_COMPLETED),
      createCustomPayloadMessage(todos),
    ]
  );
};

module.exports = {
  handleDateCompletion,
  analyzeNaturalLanguage,
};
