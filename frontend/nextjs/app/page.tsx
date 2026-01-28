'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
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

  const createUser = async (e: React.FormEvent) => {
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Next.js Technology Stack Benchmark</h1>

      <form onSubmit={createUser} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="number"
          placeholder="Age"
          value={newUser.age}
          onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}>
          Add User
        </button>
      </form>

      <button onClick={runBenchmark} disabled={loading} style={{ padding: '8px 12px', marginBottom: '20px' }}>
        {loading ? 'Running...' : 'Run Benchmark'}
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Age</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.age}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                <button onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
