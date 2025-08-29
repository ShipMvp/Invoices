import { AuthService } from './auth-service';
import type { components } from './schema';

// Use generated types from schema
export type CustomerDto = components['schemas']['ShipMvp.Application.Customers.CustomerDto'];
export type CreateCustomerRequest = components['schemas']['ShipMvp.Application.Customers.CreateCustomerRequest'];
export type UpdateCustomerRequest = components['schemas']['ShipMvp.Application.Customers.UpdateCustomerRequest'];
export type CustomerStatus = components['schemas']['ShipMvp.Domain.Customers.CustomerStatus'];

export interface CustomerSearchParams {
  search?: string;
  status?: CustomerStatus;
  industry?: string;
  personInCharge?: string;
  page?: number;
  pageSize?: number;
}

export const customerApi = {
  /**
   * Get all customers
   */
  async getAll(params?: CustomerSearchParams): Promise<CustomerDto[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status !== undefined) searchParams.append('status', params.status.toString());
    if (params?.industry) searchParams.append('industry', params.industry);
    if (params?.personInCharge) searchParams.append('personInCharge', params.personInCharge);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/api/customers?${queryString}` : '/api/customers';
    
    return await AuthService.authenticatedFetch<CustomerDto[]>(url, { method: 'GET' });
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<CustomerDto> {
    return await AuthService.authenticatedFetch<CustomerDto>(`/api/customers/${id}`, { method: 'GET' });
  },

  /**
   * Create new customer
   */
  async create(customer: CreateCustomerRequest): Promise<CustomerDto> {
    return await AuthService.authenticatedFetch<CustomerDto>('/api/customers', {
      method: 'POST',
      data: customer
    });
  },

  /**
   * Update existing customer
   */
  async update(id: string, customer: UpdateCustomerRequest): Promise<CustomerDto> {
    return await AuthService.authenticatedFetch<CustomerDto>(`/api/customers/${id}`, {
      method: 'PUT',
      data: customer
    });
  },

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    await AuthService.authenticatedFetch<void>(`/api/customers/${id}`, { method: 'DELETE' });
  },

  /**
   * Search customers
   */
  async search(searchTerm: string): Promise<CustomerDto[]> {
    return this.getAll({ search: searchTerm });
  },

  /**
   * Get customers by status
   */
  async getByStatus(status: string): Promise<CustomerDto[]> {
    return this.getAll({ status });
  },

  /**
   * Get customers by industry
   */
  async getByIndustry(industry: string): Promise<CustomerDto[]> {
    return this.getAll({ industry });
  },

  /**
   * Get customers by person in charge
   */
  async getByPersonInCharge(personInCharge: string): Promise<CustomerDto[]> {
    return this.getAll({ personInCharge });
  }
};
