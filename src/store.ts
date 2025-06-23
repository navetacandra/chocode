import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { Chat, ChatState, Tab } from "./types";

export const storeCurrentTab: Writable<Tab> = writable("chat");
export const storeCurrentChat: Writable<Chat | null> = writable(null);
export const storeCurrentChatState: Writable<ChatState> = writable({
  message: "",
  response: "",
  isGenerating: false,
  isThinking: false,
  isWritingCode: false,
});
export const storeCurrentCode: Writable<string> = writable("");
