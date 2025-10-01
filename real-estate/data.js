// Data management module
const data = {
    // Initialize sample data
    initializeSampleData() {
        if (!localStorage.getItem('users')) {
            const sampleUsers = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'tenant@example.com',
                    phone: '+254712345678',
                    idNumber: '12345678',
                    apartmentName: 'Muthuku Apartments',
                    houseNumber: 'A1',
                    password: 'password123',
                    role: 'tenant',
                    isVerified: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'owner',
                    name: 'Apartment Owner',
                    email: 'owner@muthuku.com',
                    phone: '+254700000000',
                    idNumber: '00000000',
                    apartmentName: 'Muthuku Apartments',
                    houseNumber: 'OWNER',
                    password: 'owner123',
                    role: 'owner',
                    isVerified: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('users', JSON.stringify(sampleUsers));
        }

        if (!localStorage.getItem('rents')) {
            const sampleRents = [
                {
                    id: '1',
                    tenantId: '1',
                    amount: 15000,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
                }
            ];
            localStorage.setItem('rents', JSON.stringify(sampleRents));
        }

        if (!localStorage.getItem('notifications')) {
            const sampleNotifications = [
                {
                    id: '1',
                    userId: '1',
                    type: 'welcome',
                    message: 'Welcome to Muthuku Apartments Portal!',
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
        }
    },

    // User methods
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    // Rent methods
    getRents() {
        return JSON.parse(localStorage.getItem('rents') || '[]');
    },

    saveRents(rents) {
        localStorage.setItem('rents', JSON.stringify(rents));
    },

    // Claims methods
    getClaims() {
        return JSON.parse(localStorage.getItem('claims') || '[]');
    },

    saveClaims(claims) {
        localStorage.setItem('claims', JSON.stringify(claims));
    },

    // Notifications methods
    getNotifications() {
        return JSON.parse(localStorage.getItem('notifications') || '[]');
    },

    saveNotifications(notifications) {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    },

    // Utility methods
    generateId() {
        return Date.now().toString();
    },

    createInitialRentRecord(user) {
        const rents = this.getRents();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const newRent = {
            id: this.generateId(),
            tenantId: user.id,
            amount: 15000,
            dueDate: dueDate.toISOString(),
            status: 'pending',
            month: dueDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        };

        rents.push(newRent);
        this.saveRents(rents);
    },

    createNotification(userId, type, message) {
        const notifications = this.getNotifications();
        const newNotification = {
            id: this.generateId(),
            userId,
            type,
            message,
            isRead: false,
            createdAt: new Date().toISOString()
        };
        notifications.push(newNotification);
        this.saveNotifications(notifications);
    }
};