const { CONSTANTS, MESSAGES } = require("./constants");

// 날짜 유틸리티 함수
const getTodayDate = () => {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: CONSTANTS.TIMEZONE })
  );
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 응답 생성 헬퍼 함수들
const createResponse = (
  intentName,
  state,
  dialogAction,
  messages,
  slots = null
) => ({
  sessionState: {
    dialogAction: {
      type: dialogAction,
      ...(dialogAction === CONSTANTS.DIALOG_ACTION.ELICIT_SLOT && {
        slotToElicit: CONSTANTS.SLOT_NAMES.MISSING_DATE,
      }),
    },
    intent: {
      name: intentName,
      state,
      ...(slots && { slots }),
    },
  },
  messages,
});

const createPlainTextMessage = (content) => ({
  contentType: CONSTANTS.MESSAGE_TYPE.PLAIN_TEXT,
  content,
});

const createCustomPayloadMessage = (data) => ({
  contentType: CONSTANTS.MESSAGE_TYPE.CUSTOM_PAYLOAD,
  content: JSON.stringify({ type: "todoList", data }),
});

const createErrorResponse = (intentName, message) =>
  createResponse(
    intentName,
    CONSTANTS.INTENT_STATE.FAILED,
    CONSTANTS.DIALOG_ACTION.CLOSE,
    [createPlainTextMessage(message)]
  );

module.exports = {
  getTodayDate,
  createResponse,
  createPlainTextMessage,
  createCustomPayloadMessage,
  createErrorResponse,
};
