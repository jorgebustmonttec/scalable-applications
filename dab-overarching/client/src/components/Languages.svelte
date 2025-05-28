<script>
  let langs   = $state([]);
  let loading = $state(true);
  let error   = $state(null);

  // fetch once on mount
  $effect(async () => {
    try {
      const r = await fetch("/api/languages");
      if (!r.ok) throw new Error(r.statusText);
      langs = await r.json();
    } catch (e) {
      error = "Failed to load languages";
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<h1>Available languages</h1>

{#if loading}
  <p>Loading…</p>
{:else if error}
  <p>{error}</p>
{:else}
  <ul>
    {#each langs as l}
      <li><a href={`/languages/${l.id}`}>{l.name}</a></li>
    {/each}
  </ul>
{/if}
