<script>
  /* props ------------------------------------------------------------------ */
  let { exerciseId } = $props();   // comes from viewer component

  /* local reactive state --------------------------------------------------- */
  let source      = $state("");          // textarea live value
  let submitting  = $state(false);       // disable while POST in flight
  let subId       = $state(null);        // submission id returned by API
  let status      = $state(null);        // { grading_status, grade }
  let pollTimer   = null;                // interval id

  /* helpers ---------------------------------------------------------------- */
  const stopPolling = () => {
    pollTimer && clearInterval(pollTimer);
    pollTimer = null;
  };

  const pollStatus = (id) => {
    pollTimer = setInterval(async () => {
      try {
        const r = await fetch(`/api/submissions/${id}/status`,
                              { headers: { "Cache-Control": "no-cache" }});
        if (!r.ok) return;                       // 404 ⇒ ignore
        const data = await r.json();
        status = data;

        if (data.grading_status === "graded") {  // done – stop polling
          stopPolling();
        }
      } catch (_) {/* network glitch – retry on next tick */}
    }, 500);
  };

  /* submit handler --------------------------------------------------------- */
  const submit = async () => {
    submitting = true;
    status     = null;     // clear any previous result
    subId      = null;

    try {
      const r  = await fetch(`/api/exercises/${exerciseId}/submissions`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ source_code: source })
      });

      if (!r.ok) throw new Error(r.statusText);

      const { id } = await r.json();
      subId = id;
      pollStatus(id);

    } catch (e) {
      console.error("Submit failed:", e);
    } finally {
      submitting = false;
    }
  };

  /* cleanup when component unmounts --------------------------------------- */
  $effect(() => {
    return () => stopPolling();
  });
</script>

<textarea bind:value={source} rows="10" cols="60"></textarea>
<br />
<button disabled={submitting} onclick={submit}>
  {submitting ? "Submitting…" : "Submit"}
</button>

{#if subId}
  <p>Submission&nbsp;ID: {subId}</p>
{/if}

{#if status}
  <p>Grading&nbsp;status:&nbsp;{status.grading_status}</p>
  {#if status.grading_status === "graded"}
    <p>Grade:&nbsp;{status.grade}</p>
  {/if}
{/if}
