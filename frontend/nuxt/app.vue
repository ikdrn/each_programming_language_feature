<template>
  <div class="container">
    <h1>Nuxt Technology Stack Benchmark</h1>

    <form @submit.prevent="createUser" class="form">
      <input v-model="newUser.name" type="text" placeholder="Name" />
      <input v-model="newUser.email" type="email" placeholder="Email" />
      <input v-model="newUser.age" type="number" placeholder="Age" />
      <button type="submit">Add User</button>
    </form>

    <button @click="runBenchmark" :disabled="loading">
      {{ loading ? 'Running...' : 'Run Benchmark' }}
    </button>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Age</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.age }}</td>
          <td>
            <button @click="deleteUser(user.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const loading = ref(false);
const newUser = ref({ name: '', email: '', age: '' });
const apiUrl = 'http://localhost:6001';

const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await $fetch(`${apiUrl}/users`);
    users.value = response.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const createUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.age) return;

  try {
    await $fetch(`${apiUrl}/users`, {
      method: 'POST',
      body: {
        name: newUser.value.name,
        email: newUser.value.email,
        age: parseInt(newUser.value.age)
      }
    });
    newUser.value = { name: '', email: '', age: '' };
    await fetchUsers();
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

const deleteUser = async (id) => {
  try {
    await $fetch(`${apiUrl}/users/${id}`, { method: 'DELETE' });
    await fetchUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

const runBenchmark = async () => {
  try {
    loading.value = true;
    const response = await $fetch(`${apiUrl}/benchmark`, {
      method: 'POST',
      body: { count: 1000 }
    });
    alert(`Benchmark: ${response.benchmark.durationMs}ms (${response.benchmark.rps} rps)`);
  } catch (error) {
    console.error('Error running benchmark:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

input, button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th, table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

table th {
  background-color: #f5f5f5;
}
</style>
