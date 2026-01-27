<script>
  import { onMount } from 'svelte';

  let data = null;
  let loading = false;

  onMount(async () => {
    loading = true;
    try {
      const response = await fetch('/api/hello');
      data = await response.json();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div style="padding: 20px; font-family: sans-serif;">
  <h1>Svelte Example</h1>
  {#if loading}
    <p>Loading...</p>
  {:else if data}
    <p>Message: {data.message}</p>
    <p>Timestamp: {data.timestamp}</p>
  {/if}
</div>

<style>
</style>
