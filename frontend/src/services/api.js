import axios from 'axios';

const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: base + '/api',
  timeout: 5000,
});

const machinesAPI = {
  getAll: () => client.get('/machines'),
  get: (id) => client.get(`/machines/${id}`),
};

const authAPI = {
  login: (creds) => client.post('/auth/login', creds),
};

export { machinesAPI, authAPI };
