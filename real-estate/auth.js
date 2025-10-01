// Authentication module
const auth = {
    currentUser: null,

    // Initialize authentication
    init() {
        this.checkAuthStatus();
        this.attachEventListeners();
    },

    // Check if user is logged in
    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            ui.showMainApp();
        } else {
            this.showLogin();
        }
    },

    // Attach event listeners to forms
    attachEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    },

    // Show login page
    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('appHeader').style.display = 'none';
    },

    // Show register page
    showRegister() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('appHeader').style.display = 'none';
    },

    // Handle login form submission
    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('loginMessage');

        const users = data.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            if (!user.isVerified) {
                ui.showMessage(messageDiv, 'Account pending verification by owner', 'error');
                return;
            }
            
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            ui.showMainApp();
        } else {
            ui.showMessage(messageDiv, 'Invalid email or password', 'error');
        }
    },

    // Handle register form submission
    handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            idNumber: document.getElementById('regIdNumber').value,
            apartmentName: document.getElementById('regApartment').value,
            houseNumber: document.getElementById('regHouseNumber').value,
            password: document.getElementById('regPassword').value,
            confirmPassword: document.getElementById('regConfirmPassword').value
        };

        const messageDiv = document.getElementById('registerMessage');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            ui.showMessage(messageDiv, 'Passwords do not match', 'error');
            return;
        }

        if (formData.password.length < 6) {
            ui.showMessage(messageDiv, 'Password must be at least 6 characters', 'error');
            return;
        }

        // Check if user already exists
        const users = data.getUsers();
        if (users.find(u => u.email === formData.email)) {
            ui.showMessage(messageDiv, 'User with this email already exists', 'error');
            return;
        }

        if (users.find(u => u.idNumber === formData.idNumber)) {
            ui.showMessage(messageDiv, 'User with this ID number already exists', 'error');
            return;
        }

        if (users.find(u => u.houseNumber === formData.houseNumber)) {
            ui.showMessage(messageDiv, 'This house number is already registered', 'error');
            return;
        }

        // Create new user
        const newUser = {
            ...formData,
            id: data.generateId(),
            role: 'tenant',
            isVerified: false,
            createdAt: new Date().toISOString()
        };

        delete newUser.confirmPassword;

        users.push(newUser);
        data.saveUsers(users);

        // Create initial rent record
        data.createInitialRentRecord(newUser);

        ui.showMessage(messageDiv, 'Registration successful! Waiting for owner verification.', 'success');
        
        // Clear form and redirect
        document.getElementById('registerForm').reset();
        setTimeout(() => {
            this.showLogin();
        }, 3000);
    },

    // Logout user
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLogin();
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
};