document.addEventListener('DOMContentLoaded', function() {
    // Check if staff is logged in
    const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn');
    const currentStaff = localStorage.getItem('currentStaff');
    
    if (isStaffLoggedIn !== 'true' || !currentStaff) {
        // Redirect to login if not authenticated
        window.location.href = '../admin_staff.html';
        return;
    }
    
    const staff = JSON.parse(currentStaff);
    
    // Update navigation based on role
    document.getElementById('staffUserName').innerHTML = `${staff.name} <ion-icon name="chevron-down-outline"></ion-icon>`;
    document.getElementById('dashboardWelcome').textContent = `Welcome back, ${staff.name}!`;
    
    // Show/hide navigation items based on role
    if (staff.role === 'staff') {
        // Staff can view orders and menu items
        document.getElementById('ordersNavLink').style.display = 'block';
        document.getElementById('viewMenuNavLink').style.display = 'block';
    } else if (staff.role === 'admin') {
        // Admin can view everything except View Menu (they have Menu Management)
        document.getElementById('ordersNavLink').style.display = 'block';
        document.getElementById('menuManagementNavLink').style.display = 'block';
        document.getElementById('userManagementNavLink').style.display = 'block';
    }
    
    // Initialize dashboard
    loadDashboardStats();
    loadRecentOrders();
    
    // Setup dropdown click handler
    setupDropdownHandler();
    
    // Setup mobile menu toggle for dashboard
    setupMobileMenuToggle();
});

function setupMobileMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const dashboardNav = document.getElementById('dashboardNav');
    
    if (menuToggle && dashboardNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dashboardNav.classList.toggle('active');
            
            // Toggle icon between menu and close
            const icon = menuToggle.querySelector('ion-icon');
            if (dashboardNav.classList.contains('active')) {
                icon.setAttribute('name', 'close-outline');
            } else {
                icon.setAttribute('name', 'menu-outline');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (dashboardNav.classList.contains('active')) {
                const isClickInsideNav = dashboardNav.contains(event.target);
                const isClickOnToggle = menuToggle.contains(event.target);
                
                if (!isClickInsideNav && !isClickOnToggle) {
                    dashboardNav.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            }
        });
        
        // Close mobile menu when clicking on a link
        const navLinksItems = dashboardNav.querySelectorAll('a:not(.dropdown-toggle)');
        navLinksItems.forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't close navbar if clicking inside dropdown menus
                if (link.closest('.dropdown-menu') || link.closest('.dropdown')) {
                    return;
                }
                
                if (window.innerWidth <= 768) {
                    dashboardNav.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            });
        });
    }
}

function setupDropdownHandler() {
    const dropdown = document.querySelector('.account-dropdown');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').style.display = 'block';
    loadDashboardStats();
    loadRecentOrders();
}

function showOrders() {
    hideAllContent();
    document.getElementById('ordersContent').style.display = 'block';
    loadAllOrders();
}

function showViewMenu() {
    hideAllContent();
    document.getElementById('viewMenuContent').style.display = 'block';
    loadViewMenuItems();
}

function showMenuManagement() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can manage menu items.');
        return;
    }
    hideAllContent();
    document.getElementById('menuManagementContent').style.display = 'block';
    loadMenuItems();
}

function showUserManagement() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can manage users.');
        return;
    }
    hideAllContent();
    document.getElementById('userManagementContent').style.display = 'block';
    showUserTab('customers');
}

function hideAllContent() {
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.style.display = 'none';
    });
}

// ============================================
// DASHBOARD STATS
// ============================================

function loadDashboardStats() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    
    const pendingOrders = orders.filter(order => order.status === 'Processing').length;
    
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalMenuItems').textContent = menuItems.length;
    document.getElementById('totalUsers').textContent = users.length;
}

function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const recentOrders = orders.slice(-5).reverse();
    
    const ordersList = document.getElementById('recentOrdersList');
    
    if (recentOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <ion-icon name="receipt-outline" style="font-size: 3rem; margin-bottom: 10px;"></ion-icon>
                <p>No orders yet</p>
            </div>
        `;
        return;
    }
    
    // Map payment method for display
    const methodMap = { gcash: 'GCash', maya: 'Maya', paypal: 'PayPal' };
    ordersList.innerHTML = recentOrders.map(order => {
        const orderDate = new Date(order.date);
        const statusColor = getStatusColor(order.status);
        // Try to get the correct payment method name
        let paymentMethod = order.paymentMethodName || order.paymentMethod || (order.paymentMethodId ? methodMap[order.paymentMethodId] : null);
        if (!paymentMethod) paymentMethod = 'Unknown';
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                        ${order.status}
                    </span>
                </div>
                <div class="order-details">
                    <p><ion-icon name="location-outline"></ion-icon> ${order.address.city}, ${order.address.state}</p>
                    <p><ion-icon name="card-outline"></ion-icon> Payment Method: ${paymentMethod}</p>
                    <p><strong style="color: #f8af1e;">Total: ₱${order.total.toFixed(2)}</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ORDER MANAGEMENT
// ============================================

let currentFilter = 'all';

function loadAllOrders() {
    filterOrders(currentFilter);
}

function filterOrders(status) {
    currentFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    filteredOrders = filteredOrders.reverse();
    
    const ordersList = document.getElementById('ordersList');
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="receipt-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No ${status === 'all' ? '' : status} Orders</h3>
                <p>There are no ${status === 'all' ? '' : status.toLowerCase()} orders at the moment.</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const orderDate = new Date(order.date);
        const statusColor = getStatusColor(order.status);
        const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
        const isAdmin = currentStaff.role === 'admin';
        
        return `
            <div class="order-card detailed">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="order-actions">
                        <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid ${statusColor}40;
                            background: ${statusColor}20;
                            color: ${statusColor};
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                        ">
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipping" ${order.status === 'Shipping' ? 'selected' : ''}>Shipping</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                        ${isAdmin ? `
                        <button onclick="deleteOrder(${order.id})" class="action-btn" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            background: rgba(239, 68, 68, 0.2);
                            color: #ef4444;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            margin-left: 8px;
                        ">
                            <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                            Delete
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-info">
                        <p><ion-icon name="person-outline"></ion-icon> ${order.address.name}</p>
                        <p><ion-icon name="location-outline"></ion-icon> ${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}</p>
                        <p><ion-icon name="call-outline"></ion-icon> ${order.address.phone}</p>
                        <p><ion-icon name="card-outline"></ion-icon> ${order.paymentMethod}</p>
                    </div>
                    <div class="order-total">
                        <h3 style="color: #f8af1e; font-size: 1.5rem;">₱${order.total.toFixed(2)}</h3>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        showAlert('success', `Order #${orderId} status updated to ${newStatus}`);
        loadAllOrders();
        loadDashboardStats();
    }
}

function deleteOrder(orderId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can delete orders.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete Order #${orderId}? This action cannot be undone.`)) {
        return;
    }
    
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders = orders.filter(order => order.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showAlert('success', `Order #${orderId} has been deleted successfully!`);
    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
}

function getStatusColor(status) {
    switch(status) {
        case 'Processing': return '#f8af1e';
        case 'Shipping': return '#3b82f6';
        case 'Delivered': return '#22c55e';
        default: return '#6b7280';
    }
}

// ============================================
// MENU MANAGEMENT
// ============================================

function loadViewMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('viewMenuItemsList');
    
    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="restaurant-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Menu Items</h3>
                <p>No menu items available at the moment.</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${item.price.toFixed(2)}</p>
            </div>
            <div class="menu-item-status" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: ${item.available ? '#22c55e' : '#ef4444'}; font-weight: 600;">
                    <ion-icon name="${item.available ? 'checkmark-circle' : 'close-circle'}" style="vertical-align: middle; font-size: 1.2rem;"></ion-icon>
                    ${item.available ? 'Currently Available' : 'Currently Unavailable'}
                </p>
            </div>
        </div>
    `).join('');
}

function loadMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('menuItemsList');
    
    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="restaurant-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Menu Items</h3>
                <p>Start by adding your first menu item.</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${item.price.toFixed(2)}</p>
            </div>
            <div class="menu-item-actions">
                <button onclick="toggleAvailability(${item.id})" class="action-btn" style="background: ${item.available ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${item.available ? '#ef4444' : '#22c55e'};">
                    <ion-icon name="${item.available ? 'close-circle-outline' : 'checkmark-circle-outline'}"></ion-icon>
                    ${item.available ? 'Disable' : 'Enable'}
                </button>
                <button onclick="editMenuItem(${item.id})" class="action-btn" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                    <ion-icon name="create-outline"></ion-icon>
                    Edit
                </button>
                <button onclick="deleteMenuItem(${item.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                    <ion-icon name="trash-outline"></ion-icon>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function searchMenuItems(searchTerm) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('menuItemsList');
    
    // Filter items based on search term
    const filteredItems = menuItems.filter(item => {
        const searchLower = searchTerm.toLowerCase().trim();
        const itemName = (item.name || '').toLowerCase();
        const itemCategory = (item.category || '').toLowerCase();
        
        return itemName.includes(searchLower) || itemCategory.includes(searchLower);
    });
    
    // Display filtered results
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="search-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Results Found</h3>
                <p>No menu items match "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = filteredItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${item.price.toFixed(2)}</p>
            </div>
            <div class="menu-item-actions">
                <button onclick="toggleAvailability(${item.id})" class="action-btn" style="background: ${item.available ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${item.available ? '#ef4444' : '#22c55e'};">
                    <ion-icon name="${item.available ? 'close-circle-outline' : 'checkmark-circle-outline'}"></ion-icon>
                    ${item.available ? 'Disable' : 'Enable'}
                </button>
                <button onclick="editMenuItem(${item.id})" class="action-btn" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                    <ion-icon name="create-outline"></ion-icon>
                    Edit
                </button>
                <button onclick="deleteMenuItem(${item.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                    <ion-icon name="trash-outline"></ion-icon>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function searchViewMenuItems(searchTerm) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('viewMenuItemsList');
    
    // Filter items based on search term
    const filteredItems = menuItems.filter(item => {
        const searchLower = searchTerm.toLowerCase().trim();
        const itemName = (item.name || '').toLowerCase();
        const itemCategory = (item.category || '').toLowerCase();
        
        return itemName.includes(searchLower) || itemCategory.includes(searchLower);
    });
    
    // Display filtered results
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="search-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Results Found</h3>
                <p>No menu items match "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = filteredItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${item.price.toFixed(2)}</p>
            </div>
            <div class="menu-item-status" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: ${item.available ? '#22c55e' : '#ef4444'}; font-weight: 600;">
                    <ion-icon name="${item.available ? 'checkmark-circle' : 'close-circle'}" style="vertical-align: middle; font-size: 1.2rem;"></ion-icon>
                    ${item.available ? 'Currently Available' : 'Currently Unavailable'}
                </p>
            </div>
        </div>
    `).join('');
}

function showAddMenuItemForm() {
    const formHTML = `
        <div class="modal-overlay" id="menuItemModal" onclick="if(event.target === this) closeMenuItemModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Menu Item</h2>
                    <button onclick="closeMenuItemModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="saveMenuItem(event)">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="itemName" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₱) *</label>
                        <input type="number" id="itemPrice" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="itemCategory" required>
                            <option value="">Select category</option>
                            <option value="Steamed">Steamed Dishes</option>
                            <option value="Fried">Fried Dishes</option>
                            <option value="Baked">Baked Dishes</option>
                            <option value="Noodles">Noodles</option>
                            <option value="Special">Special Dishes</option>
                            <option value="Dessert">Dessert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" id="itemImage" placeholder="../static/images/menu-items/item.jpg">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="itemAvailable" checked>
                            Available for order
                        </label>
                    </div>
                    <button type="submit" class="submit-btn">Add Menu Item</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function saveMenuItem(event) {
    event.preventDefault();
    
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const newId = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;
    
    const newItem = {
        id: newId,
        name: document.getElementById('itemName').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        category: document.getElementById('itemCategory').value,
        image: document.getElementById('itemImage').value || '../static/images/placeholder.jpg',
        available: document.getElementById('itemAvailable').checked
    };
    
    menuItems.push(newItem);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    closeMenuItemModal();
    showAlert('success', 'Menu item added successfully!');
    loadMenuItems();
    loadDashboardStats();
}

function editMenuItem(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const item = menuItems.find(i => i.id === itemId);
    
    if (!item) return;
    
    const formHTML = `
        <div class="modal-overlay" id="menuItemModal" onclick="if(event.target === this) closeMenuItemModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Menu Item</h2>
                    <button onclick="closeMenuItemModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="updateMenuItem(event, ${itemId})">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="itemName" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₱) *</label>
                        <input type="number" id="itemPrice" value="${item.price}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="itemCategory" required>
                            <option value="Steamed" ${item.category === 'Steamed' ? 'selected' : ''}>Steamed Dishes</option>
                            <option value="Fried" ${item.category === 'Fried' ? 'selected' : ''}>Fried Dishes</option>
                            <option value="Baked" ${item.category === 'Baked' ? 'selected' : ''}>Baked Dishes</option>
                            <option value="Noodles" ${item.category === 'Noodles' ? 'selected' : ''}>Noodles</option>
                            <option value="Special" ${item.category === 'Special' ? 'selected' : ''}>Special Dishes</option>
                            <option value="Dessert" ${item.category === 'Dessert' ? 'selected' : ''}>Dessert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" id="itemImage" value="${item.image}">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="itemAvailable" ${item.available ? 'checked' : ''}>
                            Available for order
                        </label>
                    </div>
                    <button type="submit" class="submit-btn">Update Menu Item</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function updateMenuItem(event, itemId) {
    event.preventDefault();
    
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex] = {
            ...menuItems[itemIndex],
            name: document.getElementById('itemName').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            category: document.getElementById('itemCategory').value,
            image: document.getElementById('itemImage').value,
            available: document.getElementById('itemAvailable').checked
        };
        
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
        closeMenuItemModal();
        showAlert('success', 'Menu item updated successfully!');
        loadMenuItems();
    }
}

function toggleAvailability(itemId) {
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex].available = !menuItems[itemIndex].available;
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
        showAlert('success', `Menu item ${menuItems[itemIndex].available ? 'enabled' : 'disabled'} successfully!`);
        loadMenuItems();
    }
}

function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    menuItems = menuItems.filter(i => i.id !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    showAlert('success', 'Menu item deleted successfully!');
    loadMenuItems();
    loadDashboardStats();
}

function closeMenuItemModal() {
    const modal = document.getElementById('menuItemModal');
    if (modal) modal.remove();
}

// ============================================
// USER MANAGEMENT
// ============================================

function showUserTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('customersTab').style.display = tab === 'customers' ? 'block' : 'none';
    document.getElementById('staffTab').style.display = tab === 'staff' ? 'block' : 'none';
    
    if (tab === 'customers') {
        loadCustomers();
    } else {
        loadStaff();
    }
}

function loadCustomers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const customersList = document.getElementById('customersList');
    
    if (users.length === 0) {
        customersList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="people-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Customers</h3>
                <p>No customers have registered yet.</p>
            </div>
        `;
        return;
    }
    
    customersList.innerHTML = users.map((user, index) => {
        const joinDate = new Date(user.createdAt);
        return `
            <div class="user-card">
                <div class="user-avatar">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                    <p class="join-date">Joined: ${joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="user-actions">
                    <button onclick="deleteCustomer(${index})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                        <ion-icon name="trash-outline"></ion-icon>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteCustomer(index) {
    if (!confirm('Are you sure you want to delete this customer account?')) return;
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(users));
    
    showAlert('success', 'Customer account deleted successfully!');
    loadCustomers();
    loadDashboardStats();
}

function loadStaff() {
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    const staffList = document.getElementById('staffList');
    
    staffList.innerHTML = staffAccounts.map((staff, index) => {
        const joinDate = new Date(staff.createdAt);
        return `
            <div class="user-card">
                <div class="user-avatar" style="background: ${staff.role === 'admin' ? 'linear-gradient(135deg, #a855f7, #8b5cf6)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'};">
                    ${staff.name.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${staff.name}</h3>
                    <p>${staff.email}</p>
                    <p class="join-date">
                        <span class="role-badge" style="background: ${staff.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'}; color: ${staff.role === 'admin' ? '#a855f7' : '#3b82f6'};">
                            ${staff.role === 'admin' ? 'Administrator' : 'Staff'}
                        </span>
                    </p>
                </div>
                <div class="user-actions">
                    <button onclick="deleteStaff(${staff.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                        <ion-icon name="trash-outline"></ion-icon>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddStaffForm() {
    const formHTML = `
        <div class="modal-overlay" id="staffModal" onclick="if(event.target === this) closeStaffModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Staff Member</h2>
                    <button onclick="closeStaffModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="saveStaff(event)">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="staffName" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address *</label>
                        <input type="email" id="staffEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password *</label>
                        <input type="password" id="staffPassword" minlength="6" required>
                    </div>
                    <div class="form-group">
                        <label>Role *</label>
                        <select id="staffRole" required>
                            <option value="">Select role</option>
                            <option value="staff">Restaurant Staff</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button type="submit" class="submit-btn">Add Staff Member</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function saveStaff(event) {
    event.preventDefault();
    
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    const email = document.getElementById('staffEmail').value;
    
    // Check if email already exists
    if (staffAccounts.some(s => s.email === email)) {
        showAlert('error', 'Email already exists!');
        return;
    }
    
    const newId = staffAccounts.length > 0 ? Math.max(...staffAccounts.map(s => s.id)) + 1 : 1;
    
    const newStaff = {
        id: newId,
        name: document.getElementById('staffName').value,
        email: email,
        password: document.getElementById('staffPassword').value,
        role: document.getElementById('staffRole').value,
        createdAt: new Date().toISOString()
    };
    
    staffAccounts.push(newStaff);
    localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
    
    closeStaffModal();
    showAlert('success', 'Staff member added successfully!');
    loadStaff();
}

function deleteStaff(staffId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    
    if (currentStaff.id === staffId) {
        showAlert('error', 'You cannot delete your own account!');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    let staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    staffAccounts = staffAccounts.filter(s => s.id !== staffId);
    localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
    
    showAlert('success', 'Staff member deleted successfully!');
    loadStaff();
}

function closeStaffModal() {
    const modal = document.getElementById('staffModal');
    if (modal) modal.remove();
}
