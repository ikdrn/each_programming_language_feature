import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', age: '' });

  const apiUrl = 'http://localhost:6001';

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const createUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.age) return;

    try {
      await axios.post(`${apiUrl}/users`, {
        name: newUser.name,
        email: newUser.email,
        age: parseInt(newUser.age)
      });
      setNewUser({ name: '', email: '', age: '' });
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const deleteUser = async (id) => {
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
      alert(`Benchmark completed: ${response.data.benchmark.durationMs}ms (${response.data.benchmark.rps} rps)`);
    } catch (error) {
      console.error('Error running benchmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>React Technology Stack Benchmark</h1>

      <form onSubmit={createUser} className="form">
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <input
          type="number"
          placeholder="Age"
          value={newUser.age}
          onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
        />
        <button type="submit">Add User</button>
      </form>

      <button onClick={runBenchmark} disabled={loading}>
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
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.age}</td>
              <td>
                <button onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
