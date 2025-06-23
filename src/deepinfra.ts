import type { EventEmitter } from "./event";
import type { Message } from "./types";

const textDecoder = new TextDecoder();
const randomIPv4 = () =>
  Array.from({ length: 4 })
    .map((_) => Math.floor(Math.random() * 255))
    .join(".");
const isJson = (json: string) => {
  try {
    JSON.parse(json);
    return true;
  } catch (_) {
    return false;
  }
};

function processEventData(response: string) {
  response = response.replace(/^data: /, "");
  if (!isJson(response)) return "";
  const choices = JSON.parse(response).choices;
  if (!choices || choices.length < 1) return "";
  return choices[0].delta.content;
}

export async function completion(
  streamControl: EventEmitter<"completion" | "error" | "done">,
  messages: Message[],
): Promise<Message | Error> {
  try {
    const assistantMessage: Message = { role: "assistant", content: "" };
    const response = await fetch(
      "https://api.deepinfra.com/v1/openai/chat/completions",
      {
        headers: {
          accept: "text/event-stream",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Brave";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "sec-gpc": "1",
          "x-deepinfra-source": "web-page",
          "x-forwarded-for": randomIPv4(),
        },
        referrer: "https://deepinfra.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify({
          max_tokens: import.meta.env.VITE_MAX_TOKEN,
          model: import.meta.env.VITE_MODEL,
          stream: true,
          messages,
        }),
        method: "POST",
        mode: "cors",
        credentials: "omit",
      },
    );

    const reader = response.body?.getReader();
    while (true) {
      const { done, value } = await reader?.read();
      if (done) {
        streamControl.emit("done", assistantMessage);
        break;
      }

      const eventDataResponse = textDecoder.decode(value);
      for (const eventData of eventDataResponse
        .split("\n")
        .filter((f) => f.length)) {
        const contentChunk = processEventData(eventData);
        assistantMessage.content += contentChunk;
        streamControl.emit("completion", contentChunk);
      }
    }

    return assistantMessage;
  } catch (error) {
    streamControl.emit("error", error);
    return error as Error;
  }
}
