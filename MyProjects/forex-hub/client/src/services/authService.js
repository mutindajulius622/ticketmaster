import axios from 'axios';

const API_URL = 'http://localhost:3001/api/users/';

const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getProfile = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(API_URL + 'profile', config);
    return response.data;
};

const updateSettings = async (settings, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(API_URL + 'settings', settings, config);
    return response.data;
};

const deposit = async (amount, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(API_URL + 'deposit', { amount }, config);
    return response.data;
};

const withdraw = async (amount, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(API_URL + 'withdraw', { amount }, config);
    return response.data;
};

const purchaseCourse = async (courseId, price, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(API_URL + 'purchase-course', { courseId, price }, config);
    return response.data;
};

const authService = { register, login, logout, getProfile, updateSettings, deposit, withdraw, purchaseCourse };
export default authService;
