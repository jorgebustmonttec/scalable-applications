<script>
  export let id;

  let text = "";
  let submittedText = "";  // ← freeze snapshot on submit

  const handleSubmit = () => {
    submittedText = text;
  };

  function countIfs(t) {
    return (t.match(/\bif\b/g) || []).length;
  }
</script>

<textarea bind:value={text}></textarea>
<button onclick={handleSubmit}>Submit</button>

{#if submittedText}
  <p>Characters: {submittedText.length}</p>
  <p>ifs: {countIfs(submittedText)}</p>
{/if}
