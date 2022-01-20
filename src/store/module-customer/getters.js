import { api } from 'boot/axios';

export async function findCustomer() {
  const { data } = await api.get('/customers')
  return data
}
