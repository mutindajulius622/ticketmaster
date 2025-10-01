// Dashboard module
const dashboard = {
    // Load all dashboard data
    loadDashboardData() {
        this.loadRentStatus();
        this.loadRecentClaims();
        this.loadNotifications();
    },

    // Load rent status
    loadRentStatus() {
        const rents = data.getRents();
        const currentUser = auth.getCurrentUser();
        const currentRent = rents.find(r => r.tenantId === currentUser.id && r.status !== 'paid');
        
        const rentStatusDiv = document.getElementById('rentStatus');
        
        if (currentRent) {
            const dueDate = new Date(currentRent.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            let statusText = '';
            if (daysUntilDue < 0) {
                statusText = `OVERDUE by ${Math.abs(daysUntilDue)} days`;
            } else if (daysUntilDue === 0) {
                statusText = 'DUE TODAY';
            } else {
                statusText = `Due in ${daysUntilDue} days`;
            }

            rentStatusDiv.innerHTML = `
                <div class="rent-amount">Ksh ${currentRent.amount.toLocaleString()}</div>
                <div class="status-badge ${daysUntilDue < 0 ? 'status-overdue' : 'status-pending'}">
                    ${statusText}
                </div>
                <div>Due Date: ${dueDate.toLocaleDateString()}</div>
                <div>Month: ${currentRent.month}</div>
            `;
        } else {
            rentStatusDiv.innerHTML = '<div>No pending rent</div>';
        }
    },

    // Load recent claims (for dashboard)
    loadRecentClaims() {
        const claims = data.getClaims();
        const currentUser = auth.getCurrentUser();
        const userClaims = claims.filter(c => c.tenantId === currentUser.id)
                               .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                               .slice(0, 3);

        const claimsDiv = document.getElementById('recentClaims');
        
        if (userClaims.length > 0) {
            claimsDiv.innerHTML = userClaims.map(claim => `
                <div class="claim-item">
                    <div class="claim-header">
                        <div class="claim-title">${claim.title}</div>
                        <div class="status-badge status-${claim.status}">
                            ${claim.status.toUpperCase()}
                        </div>
                    </div>
                    <div class="claim-details">
                        <div class="claim-detail">
                            <label>Category</label>
                            <span>${claim.category}</span>
                        </div>
                        <div class="claim-detail">
                            <label>Urgency</label>
                            <span>${claim.urgency}</span>
                        </div>
                        <div class="claim-detail">
                            <label>Submitted</label>
                            <span>${new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            claimsDiv.innerHTML = '<div>No claims submitted yet</div>';
        }
    },

    // Load notifications
    loadNotifications() {
        const notifications = data.getNotifications();
        const currentUser = auth.getCurrentUser();
        const userNotifications = notifications.filter(n => n.userId === currentUser.id)
                                             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                             .slice(0, 5);

        const notificationsDiv = document.getElementById('notificationsList');
        
        if (userNotifications.length > 0) {
            notificationsDiv.innerHTML = userNotifications.map(notif => `
                <div class="notification">
                    <div>${notif.message}</div>
                    <div class="notification-time">
                        ${new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
        } else {
            notificationsDiv.innerHTML = '<div>No notifications</div>';
        }
    },

    // Load rent history
    loadRentHistory() {
        const rents = data.getRents();
        const currentUser = auth.getCurrentUser();
        const userRents = rents.filter(r => r.tenantId === currentUser.id)
                              .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

        const rentHistoryDiv = document.getElementById('rentHistory');
        
        if (userRents.length > 0) {
            rentHistoryDiv.innerHTML = userRents.map(rent => `
                <div class="claim-item">
                    <div class="claim-header">
                        <div class="claim-title">${rent.month} Rent</div>
                        <div class="status-badge status-${rent.status}">
                            ${rent.status.toUpperCase()}
                        </div>
                    </div>
                    <div class="claim-details">
                        <div class="claim-detail">
                            <label>Amount</label>
                            <span>Ksh ${rent.amount.toLocaleString()}</span>
                        </div>
                        <div class="claim-detail">
                            <label>Due Date</label>
                            <span>${new Date(rent.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div class="claim-detail">
                            <label>Status</label>
                            <span>${rent.status}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            rentHistoryDiv.innerHTML = '<div>No rent history found</div>';
        }
    },

    // Load profile information
    loadProfile() {
        const currentUser = auth.getCurrentUser();
        const profileDiv = document.getElementById('profileInfo');
        profileDiv.innerHTML = `
            <div class="claim-details">
                <div class="claim-detail">
                    <label>Full Name</label>
                    <span>${currentUser.name}</span>
                </div>
                <div class="claim-detail">
                    <label>Email</label>
                    <span>${currentUser.email}</span>
                </div>
                <div class="claim-detail">
                    <label>Phone</label>
                    <span>${currentUser.phone}</span>
                </div>
                <div class="claim-detail">
                    <label>ID Number</label>
                    <span>${currentUser.idNumber}</span>
                </div>
                <div class="claim-detail">
                    <label>Apartment</label>
                    <span>${currentUser.apartmentName}</span>
                </div>
                <div class="claim-detail">
                    <label>House Number</label>
                    <span>${currentUser.houseNumber}</span>
                </div>
                <div class="claim-detail">
                    <label>Account Status</label>
                    <span class="status-badge ${currentUser.isVerified ? 'status-paid' : 'status-pending'}">
                        ${currentUser.isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
                    </span>
                </div>
            </div>
        `;
    },

    // Refresh all data
    refreshData() {
        this.loadDashboardData();
        alert('Data refreshed!');
    }
};