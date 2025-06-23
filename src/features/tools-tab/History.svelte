<script lang="ts">
  import { currentChat, currentTab } from "../../lib/store";
  import type { Chat } from "../../types";

  let histories = JSON.parse(
    localStorage.getItem("chat-history") || "[]",
  ) as Chat[];

  function deleteChat(id: number) {
    histories = histories.filter((h) => h.id !== id);
    localStorage.setItem("chat-history", JSON.stringify(histories));
    if ($currentChat?.id === id) {
      currentChat.set({
        id: 0,
        title: "New Chat",
        code: "",
        isError: false,
        messages: [],
      });
    }
    currentTab.set("history");
  }

  function newChat() {
    currentChat.set({
      id: Date.now(),
      title: "New Chat",
      code: "",
      isError: false,
      messages: [],
    });
    currentTab.set("chat");
  }

  function selectChat(id: number) {
    const match = histories.find((h) => h.id === id);
    if (!match) return;
    currentChat.set(match);
    currentTab.set("chat");
  }
</script>

<div class="tab-content w-full h-[calc(100vh-18rem)] active" id="history">
  <div class="space-y-4 w-full h-full overflow-y-auto p-4">
    <button
      tabindex={1}
      class="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg shadow-[4px_4px_0_0_#f59e0b] press-effect hover:bg-yellow-500 transition-all"
      on:click={newChat}
    >
      <i class="fas fa-plus"></i> New Chat
    </button>

    {#each histories as history}
      <div
        tabindex={2}
        role="button"
        class="bg-gray-700 p-4 rounded-lg flex justify-between items-center press-effect cursor-pointer group hover:bg-gray-600 transition-all"
        on:click={(e) => e.target.tagName !== 'I' && selectChat(history.id)}
      >
        <span class="line-clamp-1 max-w-56">{history.title}</span>
        <i
          class="fas fa-trash text-red-400 hover:text-red-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150 z-10"
          on:click={() => deleteChat(history.id)}
          role="button"
        ></i>
      </div>
    {/each}
  </div>
</div>
