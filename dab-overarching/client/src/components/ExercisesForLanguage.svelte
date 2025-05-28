<script>
  let { langId } = $props();     // passed in from route

  let exs     = $state([]);
  let loading = $state(true);
  let error   = $state(null);

  $effect(async () => {
    try {
      const r = await fetch(`/api/languages/${langId}/exercises`);
      if (!r.ok) throw new Error(r.statusText);
      exs = await r.json();
    } catch (e) {
      error = "Failed to load exercises";
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<h1>Available exercises</h1>

{#if loading}
  <p>Loading…</p>
{:else if error}
  <p>{error}</p>
{:else}
  <ul>
    {#each exs as e}
      <li><a href={`/exercises/${e.id}`}>{e.title}</a></li>
    {/each}
  </ul>
{/if}
