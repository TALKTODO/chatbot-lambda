// 상수 정의
const CONSTANTS = {
  INTENT_STATE: {
    FULFILLED: "Fulfilled",
    FAILED: "Failed",
    IN_PROGRESS: "InProgress",
  },
  DIALOG_ACTION: {
    CLOSE: "Close",
    ELICIT_SLOT: "ElicitSlot",
  },
  MESSAGE_TYPE: {
    PLAIN_TEXT: "PlainText",
    CUSTOM_PAYLOAD: "CustomPayload",
  },
  SLOT_NAMES: {
    MISSING_DATE: "MissingDate",
    TASK_TEXT: "TaskText",
  },
  DATE_PLACEHOLDER: "날짜 없음",
  GPT_MODEL: "gpt-3.5-turbo",
  TIMEZONE: "Asia/Seoul",
};

const MESSAGES = {
  DATE_NOT_UNDERSTOOD: "죄송해요, 날짜를 이해하지 못했어요. 다시 말해줄래요?",
  INPUT_NOT_UNDERSTOOD:
    "죄송해요, 제가 잘 이해하지 못했어요 😢 다시 한 번 말해줄래요?",
  NO_TODOS: "죄송해요, 이해하지 못했어요 😢 다시 한 번 말해줄래요?",
  DATE_SET: (task, date) => `"${task}"의 날짜를 ${date}로 설정했어요!`,
  DATE_REQUEST: (task) => `"${task}"는 언제 하실 건가요? 날짜를 알려주세요.`,
  TODOS_COMPLETED:
    "할 일 목록을 정리했어요! 자세한 내용은 모달을 확인해 주세요.",
  ERROR_OCCURRED: (message) => `에러가 발생했어요: ${message}`,
};

module.exports = {
  CONSTANTS,
  MESSAGES,
};
