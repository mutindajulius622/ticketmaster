// UI management module
const ui = {
    // Show main application
    showMainApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('appHeader').style.display = 'flex';
        
        const currentUser = auth.getCurrentUser();
        document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name} (${currentUser.houseNumber})`;
        dashboard.loadDashboardData();
    },

    // Show specific tab
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        event.target.classList.add('active');

        // Load tab-specific data
        switch(tabName) {
            case 'rent':
                dashboard.loadRentHistory();
                break;
            case 'claims':
                claims.loadAllClaims();
                break;
            case 'profile':
                dashboard.loadProfile();
                break;
        }
    },

    // Show message
    showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
};