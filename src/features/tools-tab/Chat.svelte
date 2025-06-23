<script lang="ts">
  import { currentChat, currentChatState, currentCode } from "../../lib/store";
  import { EventEmitter } from "../../lib/event";
  import { extractContent, restoreCodeFromMessage } from "../../lib/helper";
  import { completion } from "../../lib/deepinfra";
  import type { AssistantMessage, Message } from "../../types";

  const streamControl = new EventEmitter<"completion" | "error" | "done">();

  function toggleThinkBlock(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLButtonElement;
    },
  ) {
    const thinkBlock =
      e.currentTarget.parentElement.parentElement.querySelector(".think-block");
    thinkBlock.classList.toggle("expanded");
    e.currentTarget.textContent = thinkBlock.classList.contains("expanded")
      ? "Hide thoughts"
      : "Show thoughts";
  }

  async function generate() {
    if ($currentChat.id === 0) $currentChat.id = Date.now();
    $currentChat.isError = false;
    $currentChatState.message = "";
    $currentChatState.response = "";
    $currentChatState.isGenerating = true;
    $currentChatState.isThinking = true;

    await completion(streamControl, $currentChat.messages);
  }

  async function submit(
    e?: KeyboardEvent & {
      currentTarget: EventTarget & HTMLTextAreaElement;
    },
  ) {
    if (e) e.preventDefault();
    const prompt = $currentChatState.message.trim();
    if (!prompt || $currentChatState.isGenerating) return;

    if ($currentChat.messages.length < 1) {
      $currentChat.messages.push({
        role: "system",
        content: import.meta.env.VITE_SYSTEM_PROMPT,
      });
    }
    $currentChat.messages.push({ role: "user", content: prompt });
    currentChat.update(() => $currentChat);
    await generate();
  }

  streamControl.on("completion", (chunk: string) => {
    $currentChatState.response += chunk;
    $currentChatState.isThinking =
      $currentChatState.response.indexOf("</chocode-reasoning>") < 0;
    $currentChatState.isWritingCode =
      $currentChatState.response.indexOf("<chocode-html>") >= 0 &&
      $currentChatState.response.indexOf("</chocode-html>") < 0;

    const code = extractContent($currentChatState.response, "chocode-html");
    $currentChat.code = code;
  });

  streamControl.on("error", (error: Error) => {
    $currentChat.isError = true;
    $currentChatState.isGenerating = false;
    $currentChatState.isThinking = false;
    $currentChatState.isWritingCode = false;
    console.error(error);
  });

  streamControl.on("done", (_assistantMessage: Message) => {
    const response = _assistantMessage.content;
    const assistantMessage: AssistantMessage = {
      id: Date.now(),
      role: "assistant",
      content: response,
      thinkResponse: extractContent(response, "chocode-reasoning"),
      textResponse: extractContent(response, "chocode-text"),
      codeResponse: extractContent(response, "chocode-html"),
      commitMessage: extractContent(response, "chocode-commit-message"),
    };

    $currentChatState.isGenerating = false;
    $currentChatState.isThinking = false;
    $currentChatState.isWritingCode = false;

    if ($currentChat.messages.length <= 2) {
      const chatTitle = extractContent(response, "chocode-chat-title");
      $currentChat.title = chatTitle;
    }
    $currentChat.messages.push(assistantMessage);
    currentChat.update(() => $currentChat);
  });
</script>

<div class="tab-content relative" id="chat">
  <div class="w-full h-[calc(100vh-18rem)] flex flex-col gap-4">
    <div
      id="chat-messages"
      class="w-full h-[calc(100%-4rem)] overflow-y-auto mb-4 space-y-4 px-2"
    >
      {#each $currentChat.messages.filter((m) => m.role !== "system") as message}
        {#if message.role === "user"}
          <div class="flex flex-col items-end">
            <div class="text-sm text-gray-400">User</div>
            <pre
              class="bg-yellow-400 text-gray-900 p-3 rounded-lg max-w-xs whitespace-pre-wrap break-words font-sans">{message.content}</pre>
          </div>
        {:else if "id" in message && message.role === "assistant"}
          <div class="flex flex-col items-start">
            <div class="text-sm text-gray-400">
              {import.meta.env.VITE_ASSISTANT_NAME}
            </div>
            <div class="bg-gray-700 p-3 rounded-lg max-w-xs">
              <pre
                class="text-white whitespace-pre-wrap break-words font-sans">{message.textResponse}</pre>
              <div class="think-block">
                <pre
                  class="font-sans whitespace-pre-wrap">{message.thinkResponse}</pre>
              </div>
              <div
                class="flex flex-col md:flex-row gap-2 justify-between w-full"
              >
                <button
                  class="text-sm text-yellow-400 mt-1 hover:underline"
                  on:click={toggleThinkBlock}>Show thoughts</button
                >
                {#if message.commitMessage && message.codeResponse}
                  <button
                    class="inline-block bg-yellow-400 text-gray-900 font-bold py-1 px-2 rounded-lg press-effect"
                    on:click={() =>
                      restoreCodeFromMessage(
                        $currentChat.messages.filter((m) => "id" in m),
                        message.id,
                      )}>Restore</button
                  >
                {/if}
              </div>
            </div>
          </div>
        {/if}
      {/each}

      {#if $currentChatState.isGenerating}
        <div class="flex flex-col items-start">
          <div class="text-sm text-gray-400">
            {import.meta.env.VITE_ASSISTANT_NAME}
          </div>
          <div class="bg-gray-700 p-3 rounded-lg max-w-xs">
            <pre
              class="text-white whitespace-pre-wrap break-words font-sans">{extractContent(
                $currentChatState.response,
                "chocode-text",
              )}</pre>
            <div
              class={"think-block" +
                ($currentChatState.isThinking ? " expanded" : "")}
            >
              <pre class="font-sans whitespace-pre-wrap">{extractContent(
                  $currentChatState.response,
                  "chocode-reasoning",
                )}</pre>
            </div>
            <button
              class="text-sm text-yellow-400 mt-1 hover:underline"
              on:click={toggleThinkBlock}
              >{$currentChatState.isThinking ? "Hide" : "Show"} thoughts</button
            >
          </div>
        </div>
      {/if}

      {#if $currentChat.isError}
        <div class="w-full p-4 flex flex-col items-center text-center">
          <h4 class="text-gray-400 mb-2 text-lg mx-auto">
            <i class="fa fa-info-circle w-5 h-5"></i>
            Hmm... Something seems to have gone wrong.
          </h4>
          <button
            class="bg-yellow-400 text-gray-900 font-bold py-1.5 px-4 mx-auto rounded-lg shadow-[4px_4px_0_0_#f59e0b] press-effect"
            on:click={generate}>Re-generate</button
          >
        </div>
      {/if}
    </div>

    {#if $currentChatState.isGenerating}
      <div class="typing-indicator absolute left-0 bottom-16 pb-2">
        <span
          >{$currentChatState.isThinking
            ? "Thinking"
            : $currentChatState.isWritingCode
              ? "Writing code"
              : "Generating"}</span
        >
        <div class="dot-wraper">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </div>
      </div>
    {/if}
    <div class="flex space-x-2 h-16 w-full">
      <textarea
        id="messageInput"
        placeholder="Type your message..."
        class="flex-grow p-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
        contenteditable="true"
        on:keydown={(e) => e.key === "Enter" && !e.shiftKey && submit(e)}
        bind:value={$currentChatState.message}
      ></textarea>
      <button
        class="bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg shadow-[4px_4px_0_0_#f59e0b] press-effect"
        on:click={submit}>Send</button
      >
    </div>
  </div>
</div>
