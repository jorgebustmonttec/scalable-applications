<script>
  let { submitLabel = "Submit" } = $props();

  let text           = $state("");       // live typing
  let submittedText  = $state(null);     // only updated on submit

  const submit = () => {
    submittedText = text;
  };

  const ifs = () => (submittedText?.match(/\bif\b/g) || []).length;
</script>

<textarea bind:value={text}></textarea>
<button onclick={submit}>{submitLabel}</button>

{#if submittedText !== null}
  <p>Characters: {submittedText.length}</p>
  <p>ifs: {ifs()}</p>
{/if}
