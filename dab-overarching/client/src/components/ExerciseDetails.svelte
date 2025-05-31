<script>
  let { exId } = $props();               // incoming id

  /* fetch exercise -------------------------------------------------------- */
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

  /* auth info ------------------------------------------------------------- */
  import { useUserState } from "../states/userState.svelte.js";
  const user = useUserState();

  import ExerciseEditor from "./ExerciseEditor.svelte";
</script>

{#if loading}
  <p>Loading…</p>

{:else if error}
  <p>{error}</p>

{:else}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>

  {#if user.email}
    <!-- authenticated -> show editor -->
    <ExerciseEditor exerciseId={exercise.id} client:idle />
  {:else}
    <!-- not logged in -->
    <p>Login or register to complete exercises.</p>
  {/if}
{/if}
