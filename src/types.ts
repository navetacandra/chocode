export type Tab = "history" | "chat" | "code" | "preview";
export type Role = "system" | "assistant" | "user";
export type Message = {
  role: Role;
  content: string;
};
export type AssistantMessage = Message & {
  id: number;
  role: "assistant";
  thinkResponse: string;
  textResponse: string;
  codeResponse: string;
  commitMessage: string;
};
export type Chat = {
  id: number;
  title: string;
  code: string;
  isError: boolean;
  messages: (AssistantMessage | Message)[];
};
export type ChatState = {
  message: string;
  response: string;
  isGenerating: boolean;
  isThinking: boolean;
  isWritingCode: boolean;
};
