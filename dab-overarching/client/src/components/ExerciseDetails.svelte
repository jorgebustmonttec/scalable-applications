<script>
  let { exId } = $props();

  /* fetch meta ------------------------------------------------------------- */
  let exercise = $state(null);
  let loading  = $state(true);
  let error    = $state(null);

  $effect(async () => {
    try {
      const r = await fetch(`/api/exercises/${exId}`);
      if (!r.ok) throw new Error(r.statusText);
      exercise = await r.json();
    } catch (e) {
      error = "Failed to load exercise";
      console.error(e);
    } finally {
      loading = false;
    }
  });

  import ExerciseEditor from "./ExerciseEditor.svelte";
</script>

{#if loading}
  <p>Loading…</p>

{:else if error}
  <p>{error}</p>

{:else}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>

  <ExerciseEditor exerciseId={exercise.id} client:idle />
{/if}
