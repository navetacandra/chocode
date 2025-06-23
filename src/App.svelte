<script lang="ts">
  import History from "./tabs/History.svelte";
  import Chat from "./tabs/Chat.svelte";
  import Code from "./tabs/Code.svelte";
  import Preview from "./tabs/Preview.svelte";
  import { storeCurrentChat, storeCurrentCode, storeCurrentTab } from "./store";
  import type { Tab, Chat as ChatType } from "./types";

  const tabs = ["History", "Chat", "Code", "Preview"];
  const switchTab = (tab: string) => storeCurrentTab.update(() => tab as Tab);
  let currentTab: string = "";

  $: storeCurrentTab.subscribe((tab) => (currentTab = tab));
  $: storeCurrentChat.subscribe((chat) => {
    if (!chat) {
      storeCurrentCode.update(() => "");
      return;
    }
    storeCurrentCode.update(() => chat.code);
    const history = JSON.parse(
      localStorage.getItem("chat-history") || "[]",
    ) as ChatType[];
    const matchIndex = history.findIndex((h) => h.id === chat.id);
    if (matchIndex < 0) {
      localStorage.setItem("chat-history", JSON.stringify([...history, chat]));
    } else {
      history[matchIndex] = chat;
      localStorage.setItem("chat-history", JSON.stringify(history));
    }
  });
</script>

<main>
  <div class="tabs">
    {#each tabs as tab}
      <button
        class={tab.toLowerCase() === currentTab ? "active" : ""}
        on:click={() => switchTab(tab.toLowerCase())}>{tab}</button
      >
    {/each}
  </div>

  {#if currentTab === "history"}
    <History />
  {:else if currentTab === "chat"}
    <Chat />
  {:else if currentTab === "code"}
    <Code />
  {:else if currentTab === "preview"}
    <Preview />
  {/if}
</main>
