<script lang="ts">
  import { registerRoute } from "./lib/store";

  const targetPath: string = window.location.pathname;
  export let path: string;

  if (path !== "**" && !$registerRoute.includes(path))
    registerRoute.update((c) => [...c, path]);
</script>

{#if path === targetPath || (!$registerRoute.includes(targetPath) && path === "**")}
  <slot />
{/if}
