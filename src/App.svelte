<script lang="ts">
  import Route from "./Route.svelte";
  import Landing from "./routes/Landing.svelte";
  import Tools from "./routes/Tools.svelte";
  import NotFound from "./routes/NotFound.svelte";
</script>

<Route path="/">
  <Landing />
</Route>
<Route path="/tools">
  <Tools />
</Route>
<Route path="**">
  <NotFound />
</Route>
