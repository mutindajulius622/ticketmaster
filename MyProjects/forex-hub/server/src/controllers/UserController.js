import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// Demo Mode Fallback Store
export const isDBConnected = () => mongoose.connection.readyState === 1;
export const DEMO_USER = {
    _id: "65f1a2b3c4d5e6f7a8b9c0d1",
    username: "Institutional_Demo",
    email: "demo@forexhub.pro",
    balance: 10000.00,
    totalProfit: 0.00,
    lotSize: 0.1,
    isAutoTrading: false,
    role: "ADMIN",
    purchasedCourses: []
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!isDBConnected()) {
            return res.status(201).json({ ...DEMO_USER, token: generateToken(DEMO_USER._id) });
        }
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        const user = await User.create({ username, email, password });
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isDBConnected()) {
            return res.json({ ...DEMO_USER, token: generateToken(DEMO_USER._id) });
        }
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                purchasedCourses: user.purchasedCourses,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json(DEMO_USER);
        }
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        if (!isDBConnected()) {
            DEMO_USER.lotSize = req.body.lotSize !== undefined ? req.body.lotSize : DEMO_USER.lotSize;
            DEMO_USER.isAutoTrading = req.body.isAutoTrading !== undefined ? req.body.isAutoTrading : DEMO_USER.isAutoTrading;
            return res.json(DEMO_USER);
        }
        const user = await User.findById(req.user.id);
        if (user) {
            user.lotSize = req.body.lotSize !== undefined ? req.body.lotSize : user.lotSize;
            user.isAutoTrading = req.body.isAutoTrading !== undefined ? req.body.isAutoTrading : user.isAutoTrading;
            const updatedUser = await user.save();
            res.json(updatedUser);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!isDBConnected()) {
            DEMO_USER.balance += parseFloat(amount);
            return res.json(DEMO_USER);
        }
        const user = await User.findById(req.user.id);
        if (user) {
            user.balance += parseFloat(amount);
            await user.save();
            res.json(user);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const withdraw = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!isDBConnected()) {
            DEMO_USER.balance -= parseFloat(amount);
            return res.json(DEMO_USER);
        }
        const user = await User.findById(req.user.id);
        if (user) {
            if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
            user.balance -= parseFloat(amount);
            await user.save();
            res.json(user);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const purchaseCourse = async (req, res) => {
    try {
        const { courseId, price } = req.body;

        if (!isDBConnected()) {
            if (DEMO_USER.balance < price) return res.status(400).json({ message: 'Insufficient demo balance' });
            DEMO_USER.balance -= price;
            DEMO_USER.purchasedCourses.push(courseId);
            return res.json(DEMO_USER);
        }

        const user = await User.findById(req.user.id);
        if (user.balance < price) return res.status(400).json({ message: 'Insufficient balance' });

        // Credit the super admin (role: ADMIN)
        const admin = await User.findOne({ role: 'ADMIN' });

        user.balance -= price;
        if (!user.purchasedCourses.includes(courseId)) {
            user.purchasedCourses.push(courseId);
        }
        await user.save();

        if (admin) {
            admin.balance += price;
            await admin.save();
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
