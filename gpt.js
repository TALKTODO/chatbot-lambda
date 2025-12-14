const OpenAI = require("openai");
const { CONSTANTS } = require("./constants");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GPT API 호출 함수
const callGPT = async (systemPrompt, userPrompt) => {
  const completion = await openai.chat.completions.create({
    model: CONSTANTS.GPT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0].message.content.trim();
};

// JSON 응답 파싱 및 에러 처리
const parseJSONResponse = (content, errorMessage) => {
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(errorMessage);
  }
};

module.exports = {
  callGPT,
  parseJSONResponse,
};
