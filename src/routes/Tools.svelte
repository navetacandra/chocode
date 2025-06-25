<script lang="ts">
  import History from "../features/tools-tab/History.svelte";
  import Chat from "../features/tools-tab/Chat.svelte";
  import Code from "../features/tools-tab/Code.svelte";
  import Preview from "../features/tools-tab/Preview.svelte";
  import { currentChat, currentCode, currentTab } from "../lib/store";
  import type { Tab, Chat as ChatType } from "../types";

  const tabs = ["History", "Chat", "Code", "Preview"];
  const switchTab = (tab: Tab) => currentTab.set(tab);

  $: currentChat.subscribe((chat) => {
    $currentCode = chat.code;
    if (chat.id === 0) return;

    const histories = JSON.parse(
      localStorage.getItem("chat-history") || "[]",
    ) as ChatType[];
    const matchIndex = histories.findIndex((history) => history.id === chat.id);

    if (matchIndex < 0) histories.push(chat);
    else histories[matchIndex] = chat;

    localStorage.setItem("chat-history", JSON.stringify(histories));
  });
  $: window.addEventListener("keydown", (e) => {
    const meta = e.ctrlKey && e.altKey;
    if (meta && e.key === "1") currentTab.set("history");
    if (meta && e.key === "2") currentTab.set("chat");
    if (meta && e.key === "3") currentTab.set("code");
    if (meta && e.key === "4") currentTab.set("preview");
    if (meta && (e.key === "t" || e.key === "T"))
      document.querySelector("textarea").focus();
  });
</script>

<div class="min-h-screen flex flex-col overflow-hidden">
  <header class="p-8">
    <a href="/">
      <h1 class="text-4xl font-bold text-center">
        <i class="fas fa-brain text-yellow-400"></i>
        <span class="text-yellow-400">ChoCode</span>
      </h1>
    </a>
  </header>
  <main class="flex-grow py-4 px-6">
    <div
      class="bg-gray-800 p-6 rounded-lg shadow-[8px_8px_0_0_#f59e0b] flex极l-col h-full"
    >
      <div class="flex space-x-2 mb-4">
        {#each tabs as tab}
          <button
            class={($currentTab === (tab.toLowerCase() as Tab)
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-700 text-white press-effect") +
              " font-bold py-2 px-6 rounded-lg"}
            on:click={() =>
              (tab.toLowerCase() as Tab) !== $currentTab &&
              switchTab(tab.toLowerCase() as Tab)}>{tab}</button
          >
        {/each}
      </div>
      <div class="flex-grow" id="content">
        {#if $currentTab === "history"}
          <History />
        {:else if $currentTab === "chat"}
          <Chat />
        {:else if $currentTab === "code"}
          <Code />
        {:else if $currentTab === "preview"}
          <Preview />
        {/if}
      </div>
    </div>
  </main>
</div>
