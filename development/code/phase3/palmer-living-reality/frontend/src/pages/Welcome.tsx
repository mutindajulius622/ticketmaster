import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Shield, Star, ArrowRight } from 'lucide-react';

const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Palmer Living Reality
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Discover your perfect home with our comprehensive real estate platform.
              From finding properties to managing rentals, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-lg px-8 py-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Background Images */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-3 gap-4 p-8">
            <img
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"
              alt="Modern apartment"
              className="rounded-lg object-cover w-full h-48"
            />
            <img
              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop"
              alt="Luxury home"
              className="rounded-lg object-cover w-full h-48"
            />
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop"
              alt="Cozy house"
              className="rounded-lg object-cover w-full h-48"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Palmer Living Reality?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive real estate solutions for property owners, managers, and tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
              <Home className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Property Management
              </h3>
              <p className="text-gray-600">
                Streamline your property management with our intuitive tools and comprehensive features.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-blue-50">
              <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600">
                Bank-level security and 24/7 support ensure your data and transactions are always protected.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50">
              <Star className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Top Rated
              </h3>
              <p className="text-gray-600">
                Trusted by thousands of users for our exceptional service and user-friendly platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse through our premium property listings and find your dream home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
                alt="Mountain View Villa"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-semibold mb-2">Mountain View Villa</h3>
                <p className="text-sm opacity-90 mb-3">Stunning views and modern amenities</p>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
                alt="Downtown Loft"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-semibold mb-2">Downtown Loft</h3>
                <p className="text-sm opacity-90 mb-3">Perfect for city living</p>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop"
                alt="Family Home"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-semibold mb-2">Family Home</h3>
                <p className="text-sm opacity-90 mb-3">Spacious and comfortable living</p>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/listings"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            >
              View All Properties <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied users and discover your perfect property today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
