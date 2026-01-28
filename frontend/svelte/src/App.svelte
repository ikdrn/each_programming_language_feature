<script>
  import axios from 'axios';

  let users = [];
  let loading = false;
  let newUser = { name: '', email: '', age: '' };
  const apiUrl = 'http://localhost:6001';

  onMount(fetchUsers);

  async function fetchUsers() {
    try {
      loading = true;
      const response = await axios.get(`${apiUrl}/users`);
      users = response.data.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      loading = false;
    }
  }

  async function createUser(e) {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.age) return;

    try {
      await axios.post(`${apiUrl}/users`, {
        name: newUser.name,
        email: newUser.email,
        age: parseInt(newUser.age)
      });
      newUser = { name: '', email: '', age: '' };
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async function deleteUser(id) {
    try {
      await axios.delete(`${apiUrl}/users/${id}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  async function runBenchmark() {
    try {
      loading = true;
      const response = await axios.post(`${apiUrl}/benchmark`, { count: 1000 });
      alert(`Benchmark: ${response.data.benchmark.durationMs}ms (${response.data.benchmark.rps} rps)`);
    } catch (error) {
      console.error('Error running benchmark:', error);
    } finally {
      loading = false;
    }
  }

  import { onMount } from 'svelte';
</script>

<div class="container">
  <h1>Svelte Technology Stack Benchmark</h1>

  <form on:submit={createUser} class="form">
    <input
      bind:value={newUser.name}
      type="text"
      placeholder="Name"
    />
    <input
      bind:value={newUser.email}
      type="email"
      placeholder="Email"
    />
    <input
      bind:value={newUser.age}
      type="number"
      placeholder="Age"
    />
    <button type="submit">Add User</button>
  </form>

  <button on:click={runBenchmark} disabled={loading}>
    {loading ? 'Running...' : 'Run Benchmark'}
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
      {#each users as user (user.id)}
        <tr>
          <td>{user.id}</td>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>{user.age}</td>
          <td>
            <button on:click={() => deleteUser(user.id)}>Delete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

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
