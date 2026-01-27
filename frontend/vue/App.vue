<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>Vue.js Example</h1>
    <!-- ローディング中は「Loading...」を表示 -->
    <div v-if="loading">
      <p>Loading...</p>
    </div>
    <!-- データ取得後はメッセージとタイムスタンプを表示 -->
    <div v-else-if="data">
      <p>Message: {{ data.message }}</p>
      <p>Timestamp: {{ data.timestamp }}</p>
    </div>
  </div>
</template>

<script>
/**
 * Vue.js サンプルコンポーネント
 * APIエンドポイントからデータを取得し、表示する基本的なコンポーネント
 */
export default {
  name: 'App',
  // コンポーネントのリアクティブデータを定義
  data() {
    return {
      data: null,        // APIから取得したデータ
      loading: false,    // ローディング状態
    };
  },
  // コンポーネントマウント後の処理
  mounted() {
    this.fetchData();
  },
  // コンポーネントのメソッドを定義
  methods: {
    /**
     * APIエンドポイントからデータを取得する非同期メソッド
     */
    async fetchData() {
      this.loading = true;
      try {
        // バックエンドのAPIエンドポイントを呼び出し
        const response = await fetch('/api/hello');
        this.data = await response.json();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
</style>
