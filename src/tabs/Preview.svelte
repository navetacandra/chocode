<script lang="ts">
  import { onDestroy } from "svelte";
  import { storeCurrentCode } from "../store";

  let code = "";
  const unsubscribeCurrentCode = storeCurrentCode.subscribe((c) => (code = c));
  onDestroy(unsubscribeCurrentCode);
</script>

<section id="preview">
  <div class="preview-container">
    <iframe
      srcdoc={code}
      frameborder="0"
      title="Preview"
      allowfullscreen
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
    ></iframe>
  </div>
</section>

<style>
  .preview-container {
    flex: 1;
  }

  iframe {
    width: 100%;
    height: 100%;
    border-radius: 0.25rem;
    background: #fffc;
  }
</style>
