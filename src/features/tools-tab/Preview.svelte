<script lang="ts">
  import { currentCode } from "../../lib/store";

  function openPreviewOnBlankPage() {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) return alert("Popup blocked!");

    previewWindow.document.write($currentCode);
  }
</script>

<div class="tab-content w-full h-[calc(100vh-18rem)] relative" id="preview">
  <iframe
    class="w-full h-full bg-gray-700 rounded-lg"
    srcdoc={$currentCode}
    frameborder="0"
    title="Preview"
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
    allowfullscreen
  ></iframe>
  <button
    class="bg-yellow-400 hover:bg-yellow-500 hover:text-black shadow-lg transition-colors duration-300 text-gray-900 w-12 h-12 flex justify-center items-center rounded-full fixed bottom-20 right-8"
    on:click={openPreviewOnBlankPage}
    aria-label="Open Preview"
  >
    <i class="fa-solid fa-arrow-up-right-from-square text-xl"></i>
  </button>
</div>
