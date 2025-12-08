import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  DollarSign,
  Wrench,
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi } from '../api/properties';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getProperties(),
  });

  const stats = {
    totalProperties: properties?.data.length || 0,
    occupiedProperties: properties?.data.filter(p => p.status === 'occupied').length || 0,
    monthlyRevenue: 250000,
    openTickets: 5,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your properties today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <Home className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold">{stats.occupiedProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold">Ksh {stats.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <Wrench className="w-8 h-8 text-orange-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold">{stats.openTickets}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Properties</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties?.data.slice(0, 5).map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {property.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.address}, {property.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {property.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      property.status === 'occupied'
                        ? 'bg-green-100 text-green-800'
                        : property.status === 'vacant'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Ksh {property.monthly_rent?.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
