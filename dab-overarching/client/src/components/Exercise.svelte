<script>
  export let id;

  let text = "";
  let submitted = false;

  function handleSubmit() {
    submitted = true;
  }

  function countIfs(t) {
    // Matches "if" as a whole word, not part of other words
    return (t.match(/\bif\b/g) || []).length;
  }
</script>

<textarea bind:value={text}></textarea>
<button onclick={handleSubmit}>Submit</button>

{#if submitted}
  <p>Characters: {text.length}</p>
  <p>ifs: {countIfs(text)}</p>
{/if}
