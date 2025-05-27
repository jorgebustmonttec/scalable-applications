<script>
  /* ────────── reactive state ────────── */
  let input = $state("");   // what’s in the <input>
  let nums  = $state([]);   // every number the user adds

  /* ────────── add-button handler ────────── */
  const add = () => {
    const n = Number(input);          // convert string → number
    if (!Number.isNaN(n)) {           // ignore empty / bad input
      nums.push(n);                   // push into reactive array
    }
    input = "";                       // clear the field
  };
</script>

<input
  type="number"
  bind:value={input}
  placeholder="Enter a number"
/>
<button onclick={add}>Add</button>

{#if nums.length}
  <ul>
    {#each nums as n}
      <li>{n}</li>
    {/each}
  </ul>

  <p>Sum: {nums.reduce((a, b) => a + b, 0)}</p>
  <p>Total numbers: {nums.length}</p>
{:else}
  <p>No numbers yet!</p>
  <p>Sum: 0</p>
  <p>Total numbers: 0</p>
{/if}

