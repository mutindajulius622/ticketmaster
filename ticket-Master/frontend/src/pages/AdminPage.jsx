import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, promoteUser, demoteUser, deleteUser } from '../redux/slices/usersSlice';
import { fetchEvents } from '../redux/slices/eventsSlice';
import { Link } from 'react-router-dom';
import {
  FaUserShield, FaUsers, FaCalendarAlt, FaPlus,
  FaTrash, FaArrowDown, FaArrowUp, FaSpinner,
  FaSearch, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminPage = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { users, loading: usersLoading, pagination: userPagination } = useSelector((state) => state.users);
  const { events, loading: eventsLoading } = useSelector((state) => state.events);

  const [activeTab, setActiveTab] = useState(currentUser?.role === 'super_admin' ? 'users' : 'events');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'users' && currentUser?.role === 'super_admin') {
      dispatch(fetchUsers({ page: 1, limit: 20, search: searchTerm }));
    } else if (activeTab === 'events') {
      dispatch(fetchEvents({ page: 1, limit: 20 }));
    }
  }, [dispatch, activeTab, currentUser?.role, searchTerm]);

  const handlePromote = (userId) => {
    if (window.confirm('Are you sure you want to promote this user to Admin?')) {
      dispatch(promoteUser(userId))
        .unwrap()
        .then(() => toast.success('User promoted to Admin'))
        .catch((err) => toast.error(err));
    }
  };

  const handleDemote = (userId) => {
    if (window.confirm('Are you sure you want to demote this Admin?')) {
      dispatch(demoteUser(userId))
        .unwrap()
        .then(() => toast.success('Admin demoted to Attendee'))
        .catch((err) => toast.error(err));
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) {
      dispatch(deleteUser(userId))
        .unwrap()
        .then(() => toast.success('User deleted successfully'))
        .catch((err) => toast.error(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <FaUserShield className="text-blue-600" />
            Admin Dashboard
          </h1>
          <Link
            to="/admin/create-event"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-lg"
          >
            <FaPlus /> Create New Event
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-8 py-4 font-bold flex items-center gap-2 transition-all ${activeTab === 'users'
                  ? 'border-b-4 border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'text-gray-500 hover:text-blue-500'
                }`}
            >
              <FaUsers /> User Management
            </button>
          )}
          <button
            onClick={() => setActiveTab('events')}
            className={`px-8 py-4 font-bold flex items-center gap-2 transition-all ${activeTab === 'events'
                ? 'border-b-4 border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'text-gray-500 hover:text-blue-500'
              }`}
          >
            <FaCalendarAlt /> Event Management
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden min-h-[500px]">
          {activeTab === 'users' && currentUser?.role === 'super_admin' ? (
            <div className="p-6">
              <div className="mb-6 relative">
                <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-blue-600" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-bold">User</th>
                        <th className="px-6 py-4 font-bold">Role</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.profile_picture || `https://i.pravatar.cc/150?u=${u.email}`}
                                alt={u.full_name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-bold">{u.full_name}</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {u.status === 'active' ? (
                                <FaCheckCircle className="text-green-500" />
                              ) : (
                                <FaTimesCircle className="text-red-500" />
                              )}
                              <span className="capitalize">{u.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {u.role === 'attendee' && (
                                <button
                                  onClick={() => handlePromote(u.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Promote to Admin"
                                >
                                  <FaArrowUp />
                                </button>
                              )}
                              {u.role === 'admin' && (
                                <button
                                  onClick={() => handleDemote(u.id)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                                  title="Demote to Attendee"
                                >
                                  <FaArrowDown />
                                </button>
                              )}
                              {u.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete User"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Manage Events</h2>
              {eventsLoading ? (
                <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-blue-600" /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No events found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition group shadow-sm">
                      <div className="flex items-center gap-4">
                        <img
                          src={event.image_url || 'https://via.placeholder.com/300x200?text=Event'}
                          alt={event.title}
                          className="w-16 h-16 object-cover rounded shadow"
                        />
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-blue-600 transition">{event.title}</h3>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(event.start_date).toLocaleDateString()}</span>
                            <span className="capitalize px-2 bg-gray-100 rounded">{event.category}</span>
                            <span className={`px-2 rounded ${event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>{event.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/events/${event.id}`} className="px-4 py-2 border rounded hover:bg-gray-50 font-semibold transition">View</Link>
                        <button className="p-3 text-red-600 hover:bg-red-50 rounded transition"><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
