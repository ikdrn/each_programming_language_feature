<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>Vue.js Example</h1>
    <div v-if="loading">
      <p>Loading...</p>
    </div>
    <div v-else-if="data">
      <p>Message: {{ data.message }}</p>
      <p>Timestamp: {{ data.timestamp }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      data: null,
      loading: false,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
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
