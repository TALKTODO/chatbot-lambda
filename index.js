const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getTodayDate = () => {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

exports.handler = async (event) => {
  try {
    const userInput = event.inputTranscript;
    const intent = event.sessionState.intent;
    const slots = intent.slots || {};

    //사용자가 날짜 추가로 입력한 경우 → GPT로 재해석해서 보완
    if (slots.MissingDate && slots.TaskText) {
      const task = slots.TaskText.value.originalValue;
      const rawDate = slots.MissingDate.value.originalValue;

      const fillPrompt = `
    다음 할 일과 날짜를 기반으로 아래 형식으로 JSON 배열 하나를 만들어줘:
    형식: [{ "task": "", "date": "" }]
    task: "${task}"
    date: "${rawDate}"
    - 날짜는 반드시 YYYY-MM-DD 형식으로 만들어줘
    - "오늘", "내일", "이번 주말", "3일 뒤", "2주 뒤" 같은 표현은 현재 날짜(${getTodayDate()}) 기준으로 계산해서 날짜로 바꿔줘
          `;

      const fillCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "반드시 JSON 배열 하나로만 응답해. 설명 금지!",
          },
          { role: "user", content: fillPrompt },
        ],
      });

      let updatedTodos;
      try {
        updatedTodos = JSON.parse(
          fillCompletion.choices[0].message.content.trim()
        );
      } catch (err) {
        return {
          sessionState: {
            dialogAction: { type: "Close" },
            intent: { name: intent.name, state: "Failed" },
          },
          messages: [
            {
              contentType: "PlainText",
              content: "죄송해요, 날짜를 이해하지 못했어요. 다시 말해줄래요?",
            },
          ],
        };
      }

      return {
        sessionState: {
          dialogAction: { type: "Close" },
          intent: {
            name: intent.name,
            state: "Fulfilled",
          },
        },
        messages: [
          {
            contentType: "PlainText",
            content: `\"${task}\"의 날짜를 ${updatedTodos[0].date}로 설정했어요!`,
          },
          {
            contentType: "CustomPayload",
            content: JSON.stringify({ type: "todoList", data: updatedTodos }),
          },
        ],
      };
    }

    //자연어 입력을 받은 경우 → GPT로 분석
    if (!userInput) throw new Error("Lex에서 전달된 입력이 없습니다.");

    const prompt = `
사용자의 입력 문장에서 해야 할 일(Todo)을 추출해줘.
형식: [{ "task": "", "date": "" }]
- 날짜가 명확하면 날짜로 (예: 2025-07-25)
- "오늘", "내일", "이번 주말", "3일 뒤", "2주 뒤" 같은 표현은 현재 날짜(${getTodayDate()}) 기준으로 계산해서 날짜로 바꿔줘
- 날짜가 전혀 없으면 "날짜 없음"으로 표시해줘

입력 문장:
${userInput}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "너는 사용자의 자연어에서 할 일을 뽑아주는 비서야. 반드시 JSON 배열로만 응답해. 설명 없이!",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    let todos;
    try {
      todos = JSON.parse(content);
    } catch (err) {
      return {
        sessionState: {
          dialogAction: { type: "Close" },
          intent: { name: intent.name, state: "Failed" },
        },
        messages: [
          {
            contentType: "PlainText",
            content:
              "죄송해요, 제가 잘 이해하지 못했어요 😢 다시 한 번 말해줄래요?",
          },
        ],
      };
    }

    if (!todos || todos.length === 0) {
      return {
        sessionState: {
          dialogAction: { type: "Close" },
          intent: { name: intent.name, state: "Failed" },
        },
        messages: [
          {
            contentType: "PlainText",
            content: "죄송해요, 이해하지 못했어요 😢 다시 한 번 말해줄래요?",
          },
        ],
      };
    }

    // 날짜가 없는 항목이 있다면 → 사용자에게 날짜 요청
    const todosWithoutDate = todos.filter((t) => t.date === "날짜 없음");

    if (todosWithoutDate.length > 0) {
      const firstMissing = todosWithoutDate[0];
      return {
        sessionState: {
          dialogAction: { type: "ElicitSlot", slotToElicit: "MissingDate" },
          intent: {
            name: intent.name,
            state: "InProgress",
            slots: {
              MissingDate: null,
              TaskText: {
                value: {
                  originalValue: firstMissing.task,
                  interpretedValue: firstMissing.task,
                  resolvedValues: [firstMissing.task],
                },
              },
            },
          },
        },
        messages: [
          {
            contentType: "PlainText",
            content: `\"${firstMissing.task}\"는 언제 하실 건가요? 날짜를 알려주세요.`,
          },
        ],
      };
    }

    // 모두 날짜 있는 경우 → 바로 처리
    return {
      sessionState: {
        dialogAction: { type: "Close" },
        intent: {
          name: intent.name,
          state: "Fulfilled",
        },
      },
      messages: [
        {
          contentType: "PlainText",
          content:
            "할 일 목록을 정리했어요! 자세한 내용은 모달을 확인해 주세요.",
        },
        {
          contentType: "CustomPayload",
          content: JSON.stringify({ type: "todoList", data: todos }),
        },
      ],
    };
  } catch (error) {
    return {
      sessionState: {
        dialogAction: { type: "Close" },
        intent: {
          name: event.sessionState.intent.name || "UnknownIntent",
          state: "Failed",
        },
      },
      messages: [
        {
          contentType: "PlainText",
          content: `에러가 발생했어요: ${error.message}`,
        },
      ],
    };
  }
};
