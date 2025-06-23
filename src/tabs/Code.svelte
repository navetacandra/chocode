<script lang="ts">
  import { onDestroy } from "svelte";
  import { storeCurrentChat, storeCurrentCode } from "../store";

  let code = "";
  function updateCode(val: string) {
    if (!!$storeCurrentChat) {
      storeCurrentChat.update((c) => (!c ? null : { ...c, code: val }));
    }
    storeCurrentCode.update(() => val);
  }
  const unsubscribeCurrentCode = storeCurrentCode.subscribe((c) => (code = c));
  onDestroy(unsubscribeCurrentCode);
</script>

<section id="code">
  <div class="code-editor">
    <textarea
      name="code"
      id="code"
      placeholder="Write some code..."
      on:input={(e) => updateCode(e.currentTarget.value)}>{code}</textarea
    >
  </div>
</section>

<style>
  .code-editor {
    flex: 1;
  }

  textarea {
    width: 100%;
    height: 100%;
    resize: none;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border-radius: 0.25rem;
  }
</style>
