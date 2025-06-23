import { currentChat, currentCode } from "./store";
import type { AssistantMessage } from "./types";

export function parseUserMessage(message: string): string {
    const endUserHtml = message.indexOf("</chocode-user-html>");
    return message.substring(endUserHtml < 0 ? 0 : endUserHtml + 20);
}

export function extractContent(response: string, tagName: string): string {
    response = (response.split("<chocode-begin-response/>")[1] || "").trim();
    response = (response.split("<chocode-end-response/>")[0] || "").trim();
    const startTag = response.indexOf(`<${tagName}>`);
    const endTag = response.indexOf(`</${tagName}>`);
    if (startTag < 0) return "";

    const splittedResponse = response.split(`<${tagName}>`);
    if (splittedResponse.length <= 1) return "";

    let result = "";
    if (endTag > 0) {
        result = splittedResponse[1].split(`</${tagName}>`)[0];
    } else {
        result = splittedResponse[1];
    }
    return result.replace(/^\n/, "").replace(/\n$/, "");
}

export function restoreCodeFromMessage(messages: AssistantMessage[], id: number) {
    const match = messages.find((h) => "id" in h && h.id === id);
    const code = match?.codeResponse || "";
    currentCode.set(code);
    currentChat.update(chat => ({ ...chat, code }))
}
