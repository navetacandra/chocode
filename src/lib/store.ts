import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { Chat, ChatState, Tab } from "./types";

export const registerRoute: Writable<string[]> = writable([]);
export const currentTab: Writable<Tab> = writable("chat");
export const currentChat: Writable<Chat> = writable({
  id: 0,
  title: "New Chat",
  code: "",
  isError: false,
  messages: [],
});
export const currentChatState: Writable<ChatState> = writable({
  message: "",
  response: "",
  isGenerating: false,
  isThinking: false,
  isWritingCode: false,
});
export const currentCode: Writable<string> = writable("");
