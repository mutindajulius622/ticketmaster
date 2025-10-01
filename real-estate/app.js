// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sample data
    data.initializeSampleData();
    
    // Initialize modules
    auth.init();
    claims.init();
    
    console.log('Muthuku Apartments Portal initialized');
});