<script lang="ts">
  import { storeCurrentChat, storeCurrentTab } from "../store";
  import type { Chat } from "../types";

  let histories = JSON.parse(
    localStorage.getItem("chat-history") || "[]",
  ) as Chat[];

  function deleteChat(id: number) {
    histories = histories.filter((h) => h.id !== id);
    localStorage.setItem("chat-history", JSON.stringify(histories));
    if ($storeCurrentChat?.id === id) {
      storeCurrentChat.update(() => null);
    }
  }

  function newChat() {
    storeCurrentChat.update(() => null);
    storeCurrentTab.update((_) => "chat");
  }

  function selectChat(id: number) {
    const match = histories.find((h) => h.id === id);
    if (!match) return;
    storeCurrentChat.update(() => match);
    storeCurrentTab.update((_) => "chat");
  }
</script>

<section id="history">
  <div>
    <div class="title">
      <h2>History</h2>
      <button on:click={newChat}>New Chat</button>
    </div>
    <ul>
      {#each histories as history, i}
        <li on:click={() => selectChat(history.id)}>
          <h3>Chat #{history.id}</h3>
          <div>
            <button class="delete" on:click={() => deleteChat(history.id)}
              >Delete</button
            >
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .title {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.25rem;
  }
  h2 {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 2px solid #fff;
    border-radius: 0.5rem;
    padding: 0.75rem;
    cursor: pointer;
    transition: all ease 0.5s;
  }

  li:hover {
    color: #000;
    background-color: #fffd;
  }

  li h3 {
    font-weight: 400;
    font-size: 1.125rem;
  }

  .delete {
    border: 2px solid #dd1a1a;
    background: #dd1a1a;
    color: #000;
  }

  .delete:hover {
    background: #c00808;
  }
</style>
