import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Building2,
  DollarSign,
  Users,
  Bath,
  Square,
  Calendar,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { propertiesApi } from '../../api/properties';
import Loader from '../../components/common/Loader';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  status: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: propertyResponse, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getProperty(id!),
    enabled: !!id,
  });

  const property: Property | undefined = propertyResponse?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Building2 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error ? 'Error loading property' : 'Property not found'}
        </h3>
        <p className="text-gray-600 mb-4">
          {error ? 'Please try again later.' : 'The property you are looking for does not exist.'}
        </p>
        <Link
          to="/properties"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/properties')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {property.address}, {property.city}, {property.state} {property.zip_code}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              property.status
            )}`}
          >
            {property.status}
          </span>
          <Link
            to={`/properties/${property.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Property
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <div className="bg-white rounded-lg shadow">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.name}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-t-lg">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600">
                {property.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Property Details</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {property.property_type}
                </span>
              </div>
              {property.bedrooms && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bedrooms</span>
                  <span className="text-sm font-medium text-gray-900">
                    {property.bedrooms}
                  </span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bathrooms</span>
                  <span className="text-sm font-medium text-gray-900">
                    {property.bathrooms}
                  </span>
                </div>
              )}
              {property.square_feet && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Square Feet</span>
                  <span className="text-sm font-medium text-gray-900">
                    {property.square_feet.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Rent</span>
                <span className="text-sm font-medium text-gray-900">
                  ${property.monthly_rent?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(property.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          {property.owner && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Property Owner</h2>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {property.owner.first_name[0]}{property.owner.last_name[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {property.owner.first_name} {property.owner.last_name}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1" />
                    {property.owner.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1" />
                    {property.owner.phone}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenant Information */}
          {property.tenant && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Tenant</h2>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {property.tenant.first_name[0]}{property.tenant.last_name[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {property.tenant.first_name} {property.tenant.last_name}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1" />
                    {property.tenant.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1" />
                    {property.tenant.phone}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
