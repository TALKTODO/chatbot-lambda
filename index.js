const { CONSTANTS, MESSAGES } = require("./constants");
const { createErrorResponse } = require("./utils");
const { handleDateCompletion, analyzeNaturalLanguage } = require("./handlers");

// 메인 핸들러
exports.handler = async (event) => {
  try {
    const userInput = event.inputTranscript;
    const intent = event.sessionState.intent;
    const slots = intent.slots || {};

    // 날짜 추가 입력 처리
    if (
      slots[CONSTANTS.SLOT_NAMES.MISSING_DATE] &&
      slots[CONSTANTS.SLOT_NAMES.TASK_TEXT]
    ) {
      const task = slots[CONSTANTS.SLOT_NAMES.TASK_TEXT].value.originalValue;
      const rawDate =
        slots[CONSTANTS.SLOT_NAMES.MISSING_DATE].value.originalValue;
      return await handleDateCompletion(intent, task, rawDate);
    }

    // 자연어 입력 분석 처리
    return await analyzeNaturalLanguage(intent, userInput);
  } catch (error) {
    const intentName = event.sessionState?.intent?.name || "UnknownIntent";
    return createErrorResponse(
      intentName,
      MESSAGES.ERROR_OCCURRED(error.message)
    );
  }
};
