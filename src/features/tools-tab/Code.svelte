<script lang="ts">
  import { currentChat, currentCode } from "../../lib/store";
  import { basicSetup, EditorView } from "codemirror";
  import { html } from "@codemirror/lang-html";
  import { css } from "@codemirror/lang-css";
  import { javascript } from "@codemirror/lang-javascript";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { EditorState } from "@codemirror/state";
  import { onMount } from "svelte";

  let editor: HTMLDivElement | null = null;
  const extensions = [
    basicSetup,
    html(),
    css(),
    javascript(),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        $currentChat.code = update.state.doc.toString();
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
      },
      ".cm-editor": {
        height: "100%",
      },
      ".cm-scroller": {
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      },
    }),
  ];

  onMount(() => {
    const state = EditorState.create({
      extensions,
      doc: $currentCode,
    });
    const view = new EditorView({
      state,
      parent: editor!,
    });

    currentCode.subscribe((code) => {
      if ($currentCode === state.doc.toString()) return;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: code,
        },
      });
    });

    window.addEventListener("keydown", (e) => {
      const meta = e.ctrlKey && e.altKey;
      if (meta && (e.key === "t" || e.key === "T")) view.focus();
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        const a = document.createElement("a");
        a.download = "preview.html";
        a.href = `data:text/html;base64,${btoa($currentCode)}`;
        a.click();
        a.remove();
      }
    });
  });
</script>

<div class="tab-content w-full h-[calc(100vh-18rem)]" id="code">
  <div
    bind:this={editor}
    class="w-full h-full rounded-lg bg-gray-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none overflow-hidden"
  ></div>
</div>
