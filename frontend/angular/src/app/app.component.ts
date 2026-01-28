import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Angular Technology Stack Benchmark</h1>

      <form (ngSubmit)="createUser()" class="form">
        <input [(ngModel)]="newUser.name" name="name" type="text" placeholder="Name" />
        <input [(ngModel)]="newUser.email" name="email" type="email" placeholder="Email" />
        <input [(ngModel)]="newUser.age" name="age" type="number" placeholder="Age" />
        <button type="submit">Add User</button>
      </form>

      <button (click)="runBenchmark()" [disabled]="loading">
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
          <tr *ngFor="let user of users">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.age }}</td>
            <td>
              <button (click)="deleteUser(user.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
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
  `]
})
export class AppComponent implements OnInit {
  users: any[] = [];
  loading = false;
  newUser = { name: '', email: '', age: '' };
  apiUrl = 'http://localhost:6001';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.http.get<any>(`${this.apiUrl}/users`).subscribe({
      next: (response) => {
        this.users = response.data || [];
      },
      error: (error) => console.error('Error fetching users:', error)
    });
  }

  createUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.age) return;

    this.http.post<any>(`${this.apiUrl}/users`, {
      name: this.newUser.name,
      email: this.newUser.email,
      age: parseInt(this.newUser.age)
    }).subscribe({
      next: () => {
        this.newUser = { name: '', email: '', age: '' };
        this.fetchUsers();
      },
      error: (error) => console.error('Error creating user:', error)
    });
  }

  deleteUser(id: number) {
    this.http.delete(`${this.apiUrl}/users/${id}`).subscribe({
      next: () => this.fetchUsers(),
      error: (error) => console.error('Error deleting user:', error)
    });
  }

  runBenchmark() {
    this.loading = true;
    this.http.post<any>(`${this.apiUrl}/benchmark`, { count: 1000 }).subscribe({
      next: (response) => {
        alert(`Benchmark: ${response.benchmark.durationMs}ms (${response.benchmark.rps} rps)`);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error running benchmark:', error);
        this.loading = false;
      }
    });
  }
}
