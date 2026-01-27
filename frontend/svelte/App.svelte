<script>
  import { onMount } from 'svelte';

  /**
   * Svelte サンプルコンポーネント
   * APIエンドポイントからデータを取得し、表示する基本的なコンポーネント
   */

  // APIから取得したデータを保持する変数
  let data = null;
  // ローディング状態を管理する変数
  let loading = false;

  // コンポーネントマウント時にAPIからデータを取得
  onMount(async () => {
    loading = true;
    try {
      // バックエンドのAPIエンドポイントを呼び出し
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
  <!-- ローディング状態に応じて表示を切り替え -->
  {#if loading}
    <!-- ローディング中は「Loading...」を表示 -->
    <p>Loading...</p>
  {:else if data}
    <!-- データ取得後はメッセージとタイムスタンプを表示 -->
    <p>Message: {data.message}</p>
    <p>Timestamp: {data.timestamp}</p>
  {/if}
</div>

<style>
</style>
