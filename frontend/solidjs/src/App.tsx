import { createSignal, onMount, For } from 'solid-js';
import axios from 'axios';
import './App.css';

export default function App() {
  const [users, setUsers] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [newUser, setNewUser] = createSignal({ name: '', email: '', age: '' });
  const apiUrl = 'http://localhost:6001';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/users`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserHandler = async (e: Event) => {
    e.preventDefault();
    const user = newUser();
    if (!user.name || !user.email || !user.age) return;

    try {
      await axios.post(`${apiUrl}/users`, {
        name: user.name,
        email: user.email,
        age: parseInt(user.age)
      });
      setNewUser({ name: '', email: '', age: '' });
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`${apiUrl}/users/${id}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const runBenchmark = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/benchmark`, { count: 1000 });
      alert(`Benchmark: ${response.data.benchmark.durationMs}ms (${response.data.benchmark.rps} rps)`);
    } catch (error) {
      console.error('Error running benchmark:', error);
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchUsers);

  return (
    <div class="container">
      <h1>SolidJS Technology Stack Benchmark</h1>

      <form onSubmit={createUserHandler} class="form">
        <input
          type="text"
          placeholder="Name"
          value={newUser().name}
          onInput={(e) => setNewUser({ ...newUser(), name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser().email}
          onInput={(e) => setNewUser({ ...newUser(), email: e.target.value })}
        />
        <input
          type="number"
          placeholder="Age"
          value={newUser().age}
          onInput={(e) => setNewUser({ ...newUser(), age: e.target.value })}
        />
        <button type="submit">Add User</button>
      </form>

      <button onClick={runBenchmark} disabled={loading()}>
        {loading() ? 'Running...' : 'Run Benchmark'}
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
          <For each={users()}>
            {(user) => (
              <tr>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.age}</td>
                <td>
                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
