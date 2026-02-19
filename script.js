// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://your-backend-url.onrender.com/api';

// State management
let currentPage = 'home';
let listings = [];
let adminToken = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Navigation handling
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    renderPage();
}

// Dark mode toggle
function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

// Show loading spinner
function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    return spinner;
}

// API calls
async function fetchApprovedListings() {
    try {
        const response = await fetch(`${API_BASE_URL}/listings?approved_only=true`);
        if (!response.ok) throw new Error('Failed to fetch listings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching listings:', error);
        showAlert('Error fetching listings', 'error');
        return [];
    }
}

async function fetchAllListings() {
    if (!adminToken) return [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/listings/all`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch listings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching all listings:', error);
        showAlert('Error fetching listings', 'error');
        return [];
    }
}

async function createListing(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/listings`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create listing');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating listing:', error);
        throw error;
    }
}

async function adminLogin(password) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

async function updateListingStatus(listingId, action) {
    if (!adminToken) throw new Error('Not authenticated');
    
    try {
        const response = await fetch(`${API_BASE_URL}/listings/${listingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ action })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update listing');
        }
        
        return data;
    } catch (error) {
        console.error('Error updating listing:', error);
        throw error;
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
}

// Search and filter
function searchListings(listings, query) {
    if (!query) return listings;
    query = query.toLowerCase();
    return listings.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.full_name.toLowerCase().includes(query)
    );
}

// Render pages
function renderPage() {
    const container = document.querySelector('.container');
    
    switch (currentPage) {
        case 'home':
            renderHome(container);
            break;
        case 'browse':
            renderBrowseListings(container);
            break;
        case 'create':
            renderCreateListing(container);
            break;
        case 'admin':
            renderAdminPanel(container);
            break;
    }
}

function renderHome(container) {
    container.innerHTML = `
        <div class="hero">
            <h1>Welcome to SabrinaPorn Marketplace</h1>
            <p>Your trusted platform for buying and selling with secure payment verification</p>
        </div>
        
        <div class="stats-container" id="stats-container">
            <div class="stat-card">
                <div class="stat-number" id="total-listings">0</div>
                <div class="stat-label">Total Listings</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="approved-listings">0</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="pending-listings">0</div>
                <div class="stat-label">Pending</div>
            </div>
        </div>
        
        <div class="featured-listings">
            <h2>Featured Listings</h2>
            <div class="grid-container" id="featured-listings"></div>
        </div>
    `;
    
    loadStats();
    loadFeaturedListings();
}

async function loadStats() {
    try {
        const stats = await fetchStats();
        document.getElementById('total-listings').textContent = stats.total;
        document.getElementById('approved-listings').textContent = stats.approved;
        document.getElementById('pending-listings').textContent = stats.pending;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadFeaturedListings() {
    try {
        const listings = await fetchApprovedListings();
        const featured = listings.slice(0, 6); // Show first 6 listings
        
        const container = document.getElementById('featured-listings');
        container.innerHTML = featured.map(listing => `
            <div class="card">
                ${listing.image_url ? 
                    `<img src="${API_BASE_URL.replace('/api', '')}${listing.image_url}" class="card-image" alt="${listing.title}">` :
                    `<div class="card-image" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));"></div>`
                }
                <div class="card-content">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-description">${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}</p>
                    <span class="card-status status-approved">Approved</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured listings:', error);
    }
}

function renderBrowseListings(container) {
    container.innerHTML = `
        <h1>Browse Listings</h1>
        
        <div class="search-bar">
            <input type="text" id="search-input" class="search-input" placeholder="Search listings...">
            <button class="btn btn-primary" onclick="performSearch()">Search</button>
        </div>
        
        <div class="grid-container" id="listings-grid">
            <div class="spinner"></div>
        </div>
    `;
    
    loadAllListings();
}

async function loadAllListings() {
    try {
        const listings = await fetchApprovedListings();
        renderListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        document.getElementById('listings-grid').innerHTML = '<p>Error loading listings</p>';
    }
}

function renderListings(listings) {
    const grid = document.getElementById('listings-grid');
    
    if (listings.length === 0) {
        grid.innerHTML = '<p>No listings found</p>';
        return;
    }
    
    grid.innerHTML = listings.map(listing => `
        <div class="card" onclick="viewListingDetails('${listing.id}')">
            ${listing.image_url ? 
                `<img src="${API_BASE_URL.replace('/api', '')}${listing.image_url}" class="card-image" alt="${listing.title}">` :
                `<div class="card-image" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));"></div>`
            }
            <div class="card-content">
                <h3 class="card-title">${listing.title}</h3>
                <p class="card-description">${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}</p>
                <span class="card-status status-approved">Approved</span>
            </div>
        </div>
    `).join('');
}

window.performSearch = function() {
    const query = document.getElementById('search-input').value;
    // In production, implement search on server
    loadAllListings();
};

function renderCreateListing(container) {
    container.innerHTML = `
        <div class="form-container">
            <h1>Create Listing</h1>
            <p>Fill out the form below to create your listing. All listings are reviewed within 24 hours.</p>
            
            <form id="create-listing-form" onsubmit="handleCreateListing(event)">
                <div class="form-group">
                    <label for="full_name">Full Name *</label>
                    <input type="text" id="full_name" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="title">Listing Title *</label>
                    <input type="text" id="title" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="description">Description *</label>
                    <textarea id="description" class="form-control" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="image">Image/Video Upload</label>
                    <input type="file" id="image" class="form-control" accept="image/*,video/*">
                </div>
                
                <div class="payment-section">
                    <h3>Payment Details</h3>
                    <p>Your payment will be verified within 24 hours</p>
                    
                    <div class="form-group">
                        <label for="gift_card_number">Gift Card Number *</label>
                        <input type="text" id="gift_card_number" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="card_name">Card Name *</label>
                        <input type="text" id="card_name" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="amount">Amount ($) *</label>
                        <input type="number" id="amount" class="form-control" step="0.01" required>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Listing</button>
            </form>
        </div>
    `;
}

window.handleCreateListing = async function(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('full_name', document.getElementById('full_name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('gift_card_number', document.getElementById('gift_card_number').value);
    formData.append('card_name', document.getElementById('card_name').value);
    formData.append('amount', document.getElementById('amount').value);
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const result = await createListing(formData);
        showAlert(result.message, 'success');
        event.target.reset();
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Listing';
    }
};

function renderAdminPanel(container) {
    if (!adminToken) {
        renderAdminLogin(container);
    } else {
        renderAdminDashboard(container);
    }
}

function renderAdminLogin(container) {
    container.innerHTML = `
        <div class="form-container">
            <h1>Admin Login</h1>
            
            <form id="admin-login-form" onsubmit="handleAdminLogin(event)">
                <div class="form-group">
                    <label for="admin-password">Password</label>
                    <input type="password" id="admin-password" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
            </form>
        </div>
    `;
}

window.handleAdminLogin = async function(event) {
    event.preventDefault();
    
    const password = document.getElementById('admin-password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const result = await adminLogin(password);
        adminToken = result.token;
        showAlert('Login successful', 'success');
        renderAdminPanel(document.querySelector('.container'));
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
};

async function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="admin-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h1>Admin Dashboard</h1>
                <button class="btn btn-secondary" onclick="handleAdminLogout()">Logout</button>
            </div>
            
            <div class="stats-container" id="admin-stats"></div>
            
            <div class="search-bar">
                <input type="text" id="admin-search" class="search-input" placeholder="Search listings...">
                <button class="btn btn-primary" onclick="loadAdminListings()">Search</button>
            </div>
            
            <table class="admin-table" id="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Title</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-table-body">
                    <tr>
                        <td colspan="7" style="text-align: center;">
                            <div class="spinner"></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    loadAdminStats();
    loadAdminListings();
}

async function loadAdminStats() {
    try {
        const stats = await fetchStats();
        const statsHtml = `
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.approved}</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.rejected}</div>
                <div class="stat-label">Rejected</div>
            </div>
        `;
        document.getElementById('admin-stats').innerHTML = statsHtml;
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

async function loadAdminListings() {
    try {
        const listings = await fetchAllListings();
        renderAdminTable(listings);
    } catch (error) {
        console.error('Error loading admin listings:', error);
        document.getElementById('admin-table-body').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--danger-color);">
                    Error loading listings
                </td>
            </tr>
        `;
    }
}

function renderAdminTable(listings) {
    const searchQuery = document.getElementById('admin-search')?.value || '';
    const filtered = searchListings(listings, searchQuery);
    
    if (filtered.length === 0) {
        document.getElementById('admin-table-body').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">No listings found</td>
            </tr>
        `;
        return;
    }
    
    const tableHtml = filtered.map(listing => `
        <tr>
            <td>
                ${listing.image_url ? 
                    `<img src="${API_BASE_URL.replace('/api', '')}${listing.image_url}" class="image-preview" alt="${listing.title}">` :
                    'No image'
                }
            </td>
            <td>${listing.full_name}</td>
            <td>${listing.email}</td>
            <td>${listing.title}</td>
            <td>
                <small>
                    Card: ${listing.payment_details?.card_name}<br>
                    Amount: $${listing.payment_details?.amount}<br>
                    Ref: ...${listing.payment_details?.gift_card_number}
                </small>
            </td>
            <td>
                <span class="card-status status-${listing.status.toLowerCase()}">
                    ${listing.status}
                </span>
            </td>
            <td class="admin-actions">
                ${listing.status !== 'Approved' ? 
                    `<button class="btn btn-success" onclick="handle
