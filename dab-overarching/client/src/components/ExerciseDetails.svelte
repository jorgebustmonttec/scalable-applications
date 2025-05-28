<script>
  let { exId } = $props();              // comes from the route

  let exercise = $state(null);
  let loading  = $state(true);
  let error    = $state(null);

  import ExerciseEditor from "./ExerciseEditor.svelte";

  /* ---------- fetch exercise on mount ---------- */
  $effect(async () => {
    try {
      const r = await fetch(`/api/exercises/${exId}`);
      if (r.status === 404) throw new Error("Not found");
      exercise = await r.json();
    } catch (e) {
      error = "Failed to load exercise";
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading…</p>

{:else if error}
  <p>{error}</p>

{:else}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>

  <!-- drop-in editor -->
  <ExerciseEditor submitLabel="Submit" />
{/if}
