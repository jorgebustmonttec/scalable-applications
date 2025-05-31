<script>
  import { useUserState } from "../../states/userState.svelte.js";
  const user = useUserState();
</script>

{#if user.loading}
  <p>Loading…</p>

{:else if user.email}
  <p>{user.email}</p>

{:else}
  <p>
    <a href="/auth/login">Login</a> |
    <a href="/auth/register">Register</a>
  </p>
{/if}
