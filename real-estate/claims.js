// Claims management module
const claims = {
    // Open new claim modal
    openNewClaimModal() {
        document.getElementById('newClaimModal').style.display = 'flex';
    },

    // Close new claim modal
    closeNewClaimModal() {
        document.getElementById('newClaimModal').style.display = 'none';
        document.getElementById('newClaimForm').reset();
    },

    // Load all claims for claims tab
    loadAllClaims() {
        const claims = data.getClaims();
        const currentUser = auth.getCurrentUser();
        const userClaims = claims.filter(c => c.tenantId === currentUser.id)
                               .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const claimsDiv = document.getElementById('claimsList');
        
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
                    <div class="claim-description">
                        <p>${claim.description}</p>
                    </div>
                    ${claim.resolutionNotes ? `
                        <div class="resolution-notes">
                            <strong>Resolution Notes:</strong> ${claim.resolutionNotes}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            claimsDiv.innerHTML = '<div>No claims submitted yet</div>';
        }
    },

    // Handle new claim submission
    handleNewClaim(e) {
        e.preventDefault();
        
        const currentUser = auth.getCurrentUser();
        const claimData = {
            id: data.generateId(),
            tenantId: currentUser.id,
            title: document.getElementById('claimTitle').value,
            category: document.getElementById('claimCategory').value,
            description: document.getElementById('claimDescription').value,
            urgency: document.getElementById('claimUrgency').value,
            status: 'submitted',
            createdAt: new Date().toISOString()
        };

        const claims = data.getClaims();
        claims.push(claimData);
        data.saveClaims(claims);

        // Create notification
        data.createNotification(
            currentUser.id,
            'claim_submitted',
            `Your claim "${claimData.title}" has been submitted and is under review.`
        );

        this.closeNewClaimModal();
        this.loadAllClaims();
        dashboard.loadRecentClaims();
        
        alert('Claim submitted successfully!');
    },

    // Initialize claims module
    init() {
        document.getElementById('newClaimForm').addEventListener('submit', (e) => this.handleNewClaim(e));
    }
};