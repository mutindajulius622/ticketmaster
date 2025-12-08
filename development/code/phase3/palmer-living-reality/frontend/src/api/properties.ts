import api from './index';

export interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  year_built?: number;
  amenities: string[];
  features: Record<string, any>;
  monthly_rent?: number;
  purchase_price?: number;
  security_deposit?: number;
  property_tax?: number;
  status: string;
  is_listed: boolean;
  owner_id: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyResponse {
  success: boolean;
  data: Property[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export const propertiesApi = {
  getProperties: (params?: Record<string, any>): Promise<PropertyResponse> =>
    api.get('/properties', { params }),

  getProperty: (id: string): Promise<{ success: boolean; data: Property }> =>
    api.get(`/properties/${id}`),

  createProperty: (data: Partial<Property>): Promise<{ success: boolean; data: Property }> =>
    api.post('/properties', data),

  updateProperty: (id: string, data: Partial<Property>): Promise<{ success: boolean; data: Property }> =>
    api.put(`/properties/${id}`, data),

  deleteProperty: (id: string): Promise<{ success: boolean; message: string }> =>
    api.delete(`/properties/${id}`),
};
