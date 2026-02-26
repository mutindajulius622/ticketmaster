import React from 'react';
import { useSelector } from 'react-redux';
import { FaUser, FaEnvelope, FaPhone, FaIdBadge } from 'react-icons/fa';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            <img
              src={user.profile_picture || `https://i.pravatar.cc/150?u=${user.email}`}
              alt={user.full_name}
              className="w-24 h-24 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">{user.full_name}</h1>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <FaEnvelope className="text-blue-600 text-xl" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>

            {user.phone_number && (
              <div className="flex items-center gap-4">
                <FaPhone className="text-blue-600 text-xl" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{user.phone_number}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <FaIdBadge className="text-blue-600 text-xl" />
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="font-semibold capitalize">{user.status}</p>
              </div>
            </div>

            {user.bio && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Bio</p>
                <p className="font-semibold">{user.bio}</p>
              </div>
            )}
          </div>

          <button className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
