import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export const employeeClient = axios.create({
  baseURL: API_BASE,
});

employeeClient.interceptors.request.use((config) => {
  const empToken = localStorage.getItem('employeeToken');
  const adminToken = localStorage.getItem('adminToken');
  const token = empToken || adminToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Accept = 'application/json';
  return config;
});

export async function employeeLogin(email, password) {
  const { data } = await employeeClient.post('/employee/login', { email, password });
  return data;
}

export async function employeeLogout() {
  const { data } = await employeeClient.post('/employee/logout');
  return data;
}

export async function getEmployeeProfile() {
  const { data } = await employeeClient.get('/employee/profile');
  return data.employee;
}

export async function listEmployees(params = {}) {
  const { data } = await employeeClient.get('/employees/manage', { params });
  return data;
}

export async function getEmployee(id) {
  const { data } = await employeeClient.get(`/employees/manage/${id}`);
  return data;
}

export async function createEmployee(formData) {
  const { data } = await employeeClient.post('/employees/manage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateEmployee(id, formData) {
  const { data } = await employeeClient.put(`/employees/manage/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteEmployee(id) {
  const { data } = await employeeClient.delete(`/employees/manage/${id}`);
  return data;
}

export async function toggleEmployeeStatus(id) {
  const { data } = await employeeClient.patch(`/employees/manage/${id}/toggle-status`);
  return data;
}

export async function listOffers(params = {}) {
  const { data } = await employeeClient.get('/employees/offers', { params });
  return data;
}

export async function updateOfferStatus(type, id, status) {
  const { data } = await employeeClient.patch(`/employees/offers/${type}/${id}/status`, { status });
  return data;
}


