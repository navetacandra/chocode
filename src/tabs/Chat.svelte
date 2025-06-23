<script lang="ts">
  import {
    storeCurrentChatState,
    storeCurrentChat,
    storeCurrentCode,
  } from "../store";
  import { completion } from "../deepinfra";
  import { EventEmitter } from "../event";
  import type { AssistantMessage, Chat, ChatState, Message } from "../types";

  let currentChatState: ChatState = {
    message: "",
    response: "",
    isGenerating: false,
    isThinking: false,
    isWritingCode: false,
  };
  let currentChat: Chat = {
    id: Date.now(),
    title: "",
    code: "",
    messages: [],
  };
  let code = "";

  const completionStreamController = new EventEmitter<
    "completion" | "error" | "done"
  >();

  const updateMessage = (message: string) =>
    storeCurrentChatState.update((state) => ({ ...state, message }));

  async function submitHandler() {
    if (currentChatState.isGenerating) return;
    const prompt =
      (!!code ? `<chocode-user-html>${code}</chocode-user-html>\n` : ``) +
      currentChatState.message;
    storeCurrentChatState.update((state) => ({
      ...state,
      message: "",
      response: "",
      isThinking: true,
      isGenerating: true,
    }));

    if (
      currentChat.messages.length < 1 ||
      currentChat.messages[0].role !== "system"
    ) {
      storeCurrentChat.update((_) => ({
        ...currentChat,
        messages: [
          {
            role: "system",
            content: import.meta.env.VITE_SYSTEM_PROMPT,
          },
        ],
      }));
    }

    if (
      !(
        currentChat.messages.length > 0 &&
        currentChat.messages.slice(-1)[0].role === "user"
      )
    ) {
      storeCurrentChat.update((_) => ({
        ...currentChat,
        messages: [...currentChat.messages, { role: "user", content: prompt }],
      }));
    }
    await completion(completionStreamController, currentChat.messages);
  }

  function parseUserMessage(message: string) {
    const endUserHtml = message.indexOf("</chocode-user-html>");
    return message.substring(endUserHtml < 0 ? 0 : endUserHtml + 20);
  }

  function extractContent(response: string, tagName: string): string {
    response = (response.split("<chocode-begin-response/>")[1] || "").trim();
    response = (response.split("<chocode-end-response/>")[0] || "").trim();
    const startTag = response.indexOf(`<${tagName}>`);
    const endTag = response.indexOf(`</${tagName}>`);
    if (startTag < 0) return "";

    let splittedResponse = response.split(`<${tagName}>`);
    if (splittedResponse.length <= 1) return "";

    let result = "";
    if (endTag > 0) {
      splittedResponse = splittedResponse[1].split(`</${tagName}>`);
      result = splittedResponse[0];
    } else {
      result = splittedResponse[1];
    }
    return result.replace(/^\n/, "").replace(/\n$/, "");
  }

  function restoreCode(id: number) {
    const match = currentChat.messages.find(
      (h) => "id" in h && h.id === id,
    ) as AssistantMessage;
    if (match)
      storeCurrentChat.update(() => ({
        ...currentChat,
        code: match.codeResponse,
      }));
  }

  completionStreamController.on("completion", (chunk) => {
    const isThinkingDone =
      currentChatState.response.indexOf("\n</chocode-reasoning>\n") > 0;
    const chocodeHtmlOpen = currentChatState.response.indexOf("<chocode-html>");
    const chocodeHtmlClose =
      currentChatState.response.indexOf("</chocode-html>");
    const isWritingCode =
      chocodeHtmlOpen > 0 && chocodeHtmlClose < chocodeHtmlOpen;

    storeCurrentChatState.update((state) => ({
      ...state,
      response: currentChatState.response + chunk,
      isThinking: !isThinkingDone,
      isWritingCode,
    }));

    if (currentChatState.response.indexOf("<chocode-html>") > 0) {
      storeCurrentCode.update(() =>
        extractContent(currentChatState.response, "chocode-html"),
      );
    }
  });

  completionStreamController.on("error", (error) => {
    console.error(error);
    alert("Something went wrong.");
  });

  completionStreamController.on("done", (_assistantMessage: Message) => {
    const thinkResponse = extractContent(
      _assistantMessage.content,
      "chocode-reasoning",
    );
    const textResponse = extractContent(
      _assistantMessage.content,
      "chocode-text",
    );
    const codeResponse = extractContent(
      _assistantMessage.content,
      "chocode-html",
    );
    const commitMessage = extractContent(
      _assistantMessage.content,
      "chocode-commit-message",
    );
    const assistantMessage: AssistantMessage = {
      thinkResponse,
      textResponse,
      codeResponse,
      commitMessage,
      id: Date.now(),
      role: "assistant",
      content: _assistantMessage.content,
    };
    storeCurrentCode.update(() =>
      extractContent(_assistantMessage.content, "chocode-html"),
    );
    storeCurrentChat.update((_) => ({
      ...currentChat,
      code: codeResponse,
      messages: [...currentChat.messages, assistantMessage],
    }));

    storeCurrentChatState.update((state) => ({
      ...state,
      isGenerating: false,
    }));
  });

  $: storeCurrentChat.subscribe(
    (chat) =>
      (currentChat = chat || {
        id: Date.now(),
        title: "",
        code: "",
        messages: [],
      }),
  );
  $: storeCurrentChatState.subscribe((state) => (currentChatState = state));
  $: storeCurrentCode.subscribe((c) => (code = c));
</script>

<section id="chat">
  <div class="messages">
    {#each currentChat.messages.filter((f) => f.role !== "system") as message}
      {#if message.role === "user"}
        <div class="user-message">
          <div>
            <h4>User</h4>
            <pre>{parseUserMessage(message.content)}</pre>
          </div>
        </div>
      {:else}
        <div class="assistant-message">
          <div>
            <h4>{import.meta.env.VITE_ASSISTANT_NAME}</h4>
            <div class="think-block">
              <div>
                Think <button
                  on:click={(e) =>
                    e.currentTarget.parentElement?.parentElement?.classList.toggle(
                      "expanded",
                    )}>Toggle</button
                >
              </div>
              <pre>{message.thinkResponse}</pre>
            </div>
            <pre>{message.textResponse}</pre>
            {#if "codeResponse" in message && message.codeResponse.length}
              <div class="action-buttons">
                <button on:click={() => restoreCode(message.id)}
                  >Restore Code</button
                >
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/each}

    {#if currentChatState.isGenerating}
      <div class="assistant-message">
        <div>
          <h4>{import.meta.env.VITE_ASSISTANT_NAME}</h4>
          <div class="think-block expanded">
            <div>
              Think <button
                on:click={(e) =>
                  e.currentTarget.parentElement?.parentElement?.classList.toggle(
                    "expanded",
                  )}>Toggle</button
              >
            </div>
            <pre>{extractContent(
                currentChatState.response,
                "chocode-reasoning",
              )}</pre>
          </div>
          <pre>{extractContent(currentChatState.response, "chocode-text")}</pre>
        </div>
      </div>
    {/if}
  </div>

  <form on:submit|preventDefault|stopPropagation={submitHandler}>
    {#if currentChatState.isGenerating}
      <div class="progress-status">
        {currentChatState.isThinking
          ? "Thinking"
          : currentChatState.isWritingCode
            ? "Writing Code"
            : "Generating"}
        <div class="dot-wraper">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </div>
      </div>
    {/if}
    <textarea
      name="message"
      id="message"
      placeholder="Write your prompt..."
      on:input={(e) => updateMessage(e.currentTarget.value)}
      bind:value={currentChatState.message}
    ></textarea>
    <button>Send</button>
  </form>
</section>

<style>
  .messages {
    width: 100%;
    height: 100%;
    padding: 0 1.5rem;
    max-height: calc(100vh - 12rem);
    overflow-y: auto;
  }
  .messages::-webkit-scrollbar {
    width: 0.5rem;
  }
  .messages::-webkit-scrollbar-thumb {
    background-color: #fff;
  }
  .messages::-webkit-scrollbar-track {
    background-color: #fff5;
  }

  .user-message,
  .assistant-message {
    width: 100%;
    display: flex;
  }
  .user-message > div,
  .assistant-message > div {
    padding: 0.75rem;
    margin-bottom: 1rem;
    min-width: 15vw;
    max-width: 75vw;
    border-radius: 0.5rem;
  }

  .user-message {
    text-align: end;
    justify-content: end;
  }

  .user-message > div {
    background-color: #fff1;
  }

  h4 {
    margin-bottom: 0.5rem;
    font-style: 1.25rem;
    line-height: 1.75rem;
  }

  pre {
    white-space: pre-wrap;
    font-size: 1rem;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    line-height: 1.5rem;
  }

  .action-buttons {
    margin-top: 0.5rem;
    display: flex;
    gap: 1rem;
  }
  .action-buttons button {
    font-size: 0.825rem;
    padding: 0.25rem 0.5rem;
  }

  form {
    display: flex;
    height: 3rem;
    position: relative;
  }
  textarea {
    flex: 1;
    padding: 0.5rem 1rem;
    border: 1px solid #fff;
    border-radius: 0.25rem;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    font-size: 1rem;
    line-height: 1.25rem;
    resize: none;
    font-family: Arial, Helvetica, sans-serif;
  }
  textarea:focus-visible {
    outline: none;
  }
  form button {
    width: 5rem;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  form button:hover,
  form button:focus,
  form button:active {
    background: #fffd;
    outline: none;
  }

  .progress-status {
    font-size: 0.825rem;
    display: flex;
    gap: 0.25rem;
    width: 100%;
    position: absolute;
    left: 0;
    right: 0;
    top: -1.5rem;
  }

  .dot-wraper {
    position: relative;
    display: flex;
    gap: 0.125rem;
    font-weight: 600;
  }

  .dot {
    animation: wave-dot ease-in-out 0.75s infinite;
  }

  .dot:nth-child(1) {
    animation-delay: 0s;
  }
  .dot:nth-child(2) {
    animation-delay: 0.15s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.3s;
  }

  .think-block {
    padding: 0.25rem;
    background-color: #fff2;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    width: 100%;
  }

  .think-block,
  .think-block pre,
  .think-block button {
    transition: all ease-in-out 0.2s;
    font-size: 0.75rem;
  }

  .think-block button {
    margin-left: 0.5rem;
    padding: 0.25rem;
  }

  .think-block pre {
    overflow: hidden;
    max-height: 50vh;
    margin-top: 0.25rem;
    overflow-y: auto;
  }
  .think-block pre::-webkit-scrollbar {
    width: 0.25rem;
  }
  .think-block pre::-webkit-scrollbar-thumb {
    background-color: #fff;
  }
  .think-block pre::-webkit-scrollbar-track {
    background-color: #fff5;
  }

  .think-block:not(.expanded) pre {
    height: 0;
  }
  .think-block.expanded pre {
    height: 100% !important;
  }

  @keyframes wave-dot {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
</style>
