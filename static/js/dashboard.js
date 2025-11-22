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
        // Admin-only analytics link
        const analyticsLinkEl = document.getElementById('analyticsNavLink');
        if (analyticsLinkEl) analyticsLinkEl.style.display = 'block';
    }
    
    // Initialize dashboard
    // Normalize any legacy orders so payment fields display correctly in admin/staff views
    normalizeOrdersForDashboard();
    loadDashboardStats();
    loadRecentOrders();
    
    // Setup dropdown click handler
    setupDropdownHandler();
    
    // Setup mobile menu toggle for dashboard
    setupMobileMenuToggle();

    // Listen for localStorage changes (orders) from other tabs/windows and refresh dashboard views
    window.addEventListener('storage', function(e) {
        try {
            if (e.key === 'orders') {
                // Orders changed in another tab (e.g., customer confirmed receipt) — refresh views
                loadAllOrders();
                loadRecentOrders();
                loadDashboardStats();
                try { if (typeof loadAnalytics === 'function') loadAnalytics(); } catch (err) { /* ignore */ }
            }
        } catch (err) { console.warn('storage event handler error', err); }
    });
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

// Show Analytics (Admin only) and kick off loading of analytics widgets
function showAnalytics() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || { role: 'staff' };
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can view analytics.');
        return;
    }
    hideAllContent();
    const content = document.getElementById('analyticsContent');
    if (!content) return;
    content.style.display = 'block';
    loadAnalytics();
}

// Load analytics data and render simple KPI cards and charts into #analyticsArea
function loadAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    // Exclude cancelled orders from analytics calculations so cancelled orders do not affect KPIs
    const analyticsOrders = orders.filter(o => !(o.status === 'Cancelled' || o.status === 'cancelled'));

    const totalOrders = analyticsOrders.length;
    const totalRevenue = analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0;

    // Product counts
    const productCounts = {};
    analyticsOrders.forEach(o => {
        (o.items || []).forEach(it => {
            const key = (it.name && String(it.name)) || (menuItems.find(m => m.id === it.id) || {}).name || (`item_${it.id || 'unknown'}`);
            const qty = Number(it.quantity) || 1;
            productCounts[key] = (productCounts[key] || 0) + qty;
        });
    });

    const productArray = Object.keys(productCounts).map(name => ({ name, count: productCounts[name] }));
    const bestSelling = productArray.slice().sort((a, b) => b.count - a.count).slice(0, 5);
    const leastSelling = productArray.slice().sort((a, b) => a.count - b.count).slice(0, 5);

    // Sales by location (municipality)
    const salesByLocation = {};
    analyticsOrders.forEach(o => {
        const city = (o.address && (o.address.city || o.address.cityName)) || 'Unknown';
        salesByLocation[city] = (salesByLocation[city] || 0) + (Number(o.total) || 0);
    });
    const salesByLocationArr = Object.keys(salesByLocation).map(k => ({ city: k, total: salesByLocation[k] })).sort((a,b)=>b.total-a.total);

    // Peak ordering times (hour of day)
    const hourCounts = new Array(24).fill(0);
    analyticsOrders.forEach(o => {
        let d = new Date(o.date || o.createdAt || Date.now());
        if (isNaN(d.getTime())) d = new Date();
        hourCounts[d.getHours()] += 1;
    });

    // Payment methods breakdown
    const paymentCounts = {};
    analyticsOrders.forEach(o => {
        const label = resolvePaymentLabel(o) || 'Unknown';
        paymentCounts[label] = (paymentCounts[label] || 0) + 1;
    });
    const paymentArr = Object.keys(paymentCounts).map(k => ({ method: k, count: paymentCounts[k] }));

    // Render into #analyticsArea
    const area = document.getElementById('analyticsArea');
    if (!area) return;

    // Helper for formatting currency
    const formatCurrency = v => '₱' + Number(v || 0).toFixed(2);

    // KPI cards - styled to match dashboard stat cards (icon + big number + label)
    const formatCurrencyLocal = v => '₱' + Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Use the same .dashboard-stats/.stat-card markup as the main dashboard
    const kpiHTML = `
        <div class="dashboard-stats" style="margin-bottom:0;">
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(34, 197, 94, 0.2);">
                    <ion-icon name="receipt-outline" style="color: #22c55e;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(59, 130, 246, 0.2);">
                    <ion-icon name="cash-outline" style="color: #3b82f6;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrencyLocal(totalRevenue)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(248, 175, 30, 0.2);">
                    <ion-icon name="stats-chart-outline" style="color: #f8af1e;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrencyLocal(avgOrderValue)}</h3>
                    <p>Average Order Value</p>
                </div>
            </div>
        </div>
    `;

    // Helper to render bars list
    const renderBars = (items, valueKey, labelKey, maxWidthPx = 360) => {
        const max = items.length ? Math.max(...items.map(it => it[valueKey])) : 1;
        return items.map(it => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <div style="flex:0 0 140px; color:rgba(255,255,255,0.85); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it[labelKey]}</div>
                <div style="flex:1; background: rgba(255,255,255,0.04); height:12px; border-radius:8px; position:relative;">
                    <div style="height:12px; border-radius:8px; background: linear-gradient(90deg,#f8af1e,#f59e0b); width: ${Math.round((it[valueKey] / (max || 1)) * 100)}%;"></div>
                </div>
                <div style="width:90px; text-align:right; color:rgba(255,255,255,0.85); font-weight:700;">${it[valueKey]}</div>
            </div>
        `).join('');
    };

    // Helper to render bars with currency label on the right
    const renderCurrencyBars = (items, valueKey, labelKey) => {
        const max = items.length ? Math.max(...items.map(it => it[valueKey])) : 1;
        return items.map(it => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <div style="flex:0 0 160px; color:rgba(255,255,255,0.85); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it[labelKey]}</div>
                <div style="flex:1; background: rgba(255,255,255,0.04); height:12px; border-radius:8px; position:relative;">
                    <div style="height:12px; border-radius:8px; background: linear-gradient(90deg,#34d399,#60a5fa); width: ${Math.round((it[valueKey] / (max || 1)) * 100)}%;"></div>
                </div>
                <div style="width:110px; text-align:right; color:rgba(255,255,255,0.85); font-weight:700;">${formatCurrencyLocal(it[valueKey])}</div>
            </div>
        `).join('');
    };

    // Best / Least selling columns
    const bestHTML = `
        <div style="flex:1; min-width:280px;">
            <h3 style="margin:0 0 8px 0;">Top 5 Best-Selling Items</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${productArray.length ? renderBars(bestSelling, 'count', 'name') : '<p style="color:rgba(255,255,255,0.6);">No product sales yet.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;
    // Removed least-selling card per request — we will show Sales by Location next to Best-Selling items

    // Sales by location bars
    const locationHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Sales by Municipality</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${salesByLocationArr.length ? renderBars(salesByLocationArr.map(s=>({ city: s.city, total: Math.round(s.total) })), 'total', 'city') : '<p style="color:rgba(255,255,255,0.6);">No sales data.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Category-based sales: aggregate totals by canonical item categories
    // Use canonical categories from the UI provided in the attachment
    const canonicalCategories = ['Steamed Dishes','Fried Dishes','Baked Dishes','Noodles','Special Dishes','Dessert'];
    const categoryTotals = {};
    // initialize canonical buckets to ensure consistent ordering/labels
    canonicalCategories.forEach(c => categoryTotals[c] = 0);

    const normalizeToCanonical = (raw) => {
        if (!raw) return null;
        const cleaned = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const canon of canonicalCategories) {
            const key = canon.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleaned.includes(key) || cleaned.includes(key.split(/\s+/)[0])) return canon;
        }
        return null;
    };

    // Use analyticsOrders here so cancelled orders are excluded from category totals
    analyticsOrders.forEach(o => {
        (o.items || []).forEach(it => {
            const menuMatch = menuItems.find(m => m.id === it.id) || {};
            // prefer explicit category on order item, then menu item category
            const rawCat = (it.category || menuMatch.category || '');
            const canonical = normalizeToCanonical(rawCat) || normalizeToCanonical(menuMatch.category) || 'Uncategorized';
            const price = Number(it.price || menuMatch.price) || 0;
            const qty = Number(it.quantity) || 1;
            categoryTotals[canonical] = (categoryTotals[canonical] || 0) + (price * qty);
        });
    });

    // Build ordered array: canonical categories first (sorted by total desc), then any extra categories
    const canonicalArr = canonicalCategories.map(c => ({ category: c, total: Math.round(categoryTotals[c] || 0) }));
    // Include 'Uncategorized' if present and >0
    const extra = [];
    if (categoryTotals['Uncategorized']) extra.push({ category: 'Uncategorized', total: Math.round(categoryTotals['Uncategorized']) });
    const categoryArr = canonicalArr.concat(extra).sort((a,b) => b.total - a.total).slice(0,8);

    const categoryHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Category-Based Sales</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${categoryArr.length ? renderCurrencyBars(categoryArr, 'total', 'category') : '<p style="color:rgba(255,255,255,0.6);">No category sales yet.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Peak times line chart (simple SVG polyline)
    const maxHour = Math.max(...hourCounts, 1);
    const points = hourCounts.map((c, i) => {
        const x = Math.round((i / 23) * 600);
        const y = Math.round(120 - (c / maxHour) * 100);
        return `${x},${y}`;
    }).join(' ');
    const hoursLabels = hourCounts.map((c, i) => `<span style="display:inline-block;width:24px;text-align:center;color:rgba(255,255,255,0.6);font-size:0.75rem;">${i}</span>`).join('');
    const peakHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Peak Sales Hours</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            <div style="background: rgba(255,255,255,0.03); padding:12px; border-radius:8px;">
                <svg width="100%" viewBox="0 0 600 140" preserveAspectRatio="none" style="width:100%; height:140px; display:block;">
                    <polyline fill="none" stroke="#60a5fa" stroke-width="3" points="${points}"></polyline>
                    ${hourCounts.map((c, i)=>{
                        const x = Math.round((i / 23) * 600);
                        const y = Math.round(120 - (c / maxHour) * 100);
                        return `<circle cx="${x}" cy="${y}" r="2.2" fill="#60a5fa"></circle>`;
                    }).join('')}
                </svg>
                <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">${hoursLabels}</div>
            </div>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Payment method pie using conic-gradient
    const totalPayments = paymentArr.reduce((s, p) => s + p.count, 0) || 1;
    const colors = ['#34d399','#60a5fa','#f472b6','#fbbf24','#f87171','#a78bfa'];
    let start = 0;
    const slices = paymentArr.map((p, idx) => {
        const perc = (p.count / totalPayments) * 100;
        const from = start; const to = start + perc; start = to;
        return `${colors[idx % colors.length]} ${from}% ${to}%`;
    }).join(', ');
    const paymentLegend = paymentArr.map((p, idx) => `<div style="display:flex; gap:8px; align-items:center; color:rgba(255,255,255,0.8);"><span style="width:12px;height:12px;background:${colors[idx%colors.length]};display:inline-block;border-radius:2px;"></span><strong style="min-width:140px">${p.method}</strong><span style="margin-left:auto;color:rgba(255,255,255,0.7);">${p.count} (${((p.count/totalPayments)*100).toFixed(0)}%)</span></div>`).join('');
    const paymentHTML = `
        <div style="flex:1; min-width:240px;">
            <h3 style="margin:0 0 8px 0;">Payment Methods</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            <div style="display:flex; gap:12px; align-items:center;">
                <div style="width:120px;height:120px;border-radius:999px;background: conic-gradient(${slices});"></div>
                <div style="flex:1">${paymentLegend || '<p style="color:rgba(255,255,255,0.6);">No payment data.</p>'}</div>
            </div>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    area.innerHTML = `
        ${kpiHTML}

        <!-- Products containers: separate boxed cards for Best and Least selling lists -->
        <div style="display:flex; gap:18px; flex-wrap:wrap; margin-top:12px;">
            <div style="flex:1; min-width:280px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${bestHTML}
            </div>
            <div style="flex:1; min-width:320px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${locationHTML}
            </div>
        </div>

        <div style="display:flex; gap:18px; flex-wrap:wrap; margin-top:6px;">
            <div style="flex:1; min-width:320px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${categoryHTML}
            </div>
            <div style="flex:1; min-width:240px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${paymentHTML}
            </div>
        </div>
    `;
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
    // Prepare a count for "Preparing" status if the dashboard has a slot for it
    const preparingOrders = orders.filter(order => order.status === 'Preparing').length;

    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    // Update preparingOrders element if it exists (non-breaking)
    const prepEl = document.getElementById('preparingOrders');
    if (prepEl) prepEl.textContent = preparingOrders;
    document.getElementById('totalMenuItems').textContent = menuItems.length;
    document.getElementById('totalUsers').textContent = users.length;
}

// Backfill/migrate orders for admin/staff dashboard to ensure payment fields are present
function normalizeOrdersForDashboard() {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (!orders.length) return;

    let changed = false;
    // Use the robust resolver to backfill and normalize orders for dashboard display
    orders = orders.map(o => {
        const updated = { ...o };
        try {
            const resolved = resolvePaymentLabel(updated);
            if (resolved && resolved !== 'Unknown') {
                if (updated.paymentMethodName !== resolved) { updated.paymentMethodName = resolved; changed = true; }
                if (!updated.paymentMethod || updated.paymentMethod !== resolved) { updated.paymentMethod = resolved; changed = true; }
                const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal', 'Cash on Delivery': 'cod' };
                const id = nameToId[resolved] || (typeof updated.paymentMethodId === 'string' ? updated.paymentMethodId : null);
                if (id && updated.paymentMethodId !== id) { updated.paymentMethodId = id; changed = true; }
            } else if (updated.paymentMethodId && typeof updated.paymentMethodId === 'object') {
                // Try to extract id/name from object-shaped paymentMethodId
                const maybe = updated.paymentMethodId.id || updated.paymentMethodId.name;
                if (maybe) {
                    const fix = resolvePaymentLabel({ paymentMethodId: maybe, paymentMethodName: updated.paymentMethodName, paymentMethod: updated.paymentMethod });
                    if (fix && fix !== 'Unknown') {
                        updated.paymentMethodName = fix;
                        updated.paymentMethod = fix;
                        const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal', 'Cash on Delivery': 'cod' };
                        updated.paymentMethodId = nameToId[fix] || String(maybe);
                        changed = true;
                    }
                }
            }
        } catch (e) {
            console.warn('normalizeOrdersForDashboard error for order', updated.id, e);
        }
        return updated;
    });

    if (changed) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}


// Resolve payment method label robustly for display (admin/staff helper)
function resolvePaymentLabel(order) {
    // Always try to return one of the canonical display names when possible:
    // 'GCash', 'Maya', 'PayPal'. Accepts strings, objects, different casings
    // and infers from substrings.
    if (!order) return 'Unknown';

    const asString = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        try {
            if (typeof val === 'object') {
                if (val.provider) return String(val.provider);
                if (val.name) return String(val.name);
                if (val.type) return String(val.type);
                if (val.id) return String(val.id);
                return JSON.stringify(val);
            }
        } catch (e) { return ''; }
        return '';
    };

    const candidates = [
        asString(order.paymentMethodName),
        asString(order.paymentMethod),
        asString(order.paymentMethodId),
        asString(order.payment),
        asString(order.payment && order.payment.provider),
        asString(order.payment && order.payment.name)
    ].join(' ').toLowerCase();

    const norm = candidates.replace(/[^a-z0-9]/g, '');
    if (norm.includes('gcash')) return 'GCash';
    if (norm.includes('paymaya') || norm.includes('maya')) return 'Maya';
    if (norm.includes('paypal')) return 'PayPal';
    if (norm.includes('cash') || norm.includes('cod')) return 'Cash on Delivery';

    // Final direct checks (in case a friendly name exists but didn't include tokens)
    const direct = (asString(order.paymentMethodName) || asString(order.paymentMethod) || asString(order.paymentMethodId) || '').trim().toLowerCase();
    if (direct === 'gcash') return 'GCash';
    if (direct === 'maya' || direct === 'paymaya') return 'Maya';
    if (direct === 'paypal') return 'PayPal';
    if (direct === 'cod' || direct === 'cash on delivery' || direct === 'cash') return 'Cash on Delivery';

    return 'Unknown';
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
    // Resolve payment method name using helper
    let paymentMethod = resolvePaymentLabel(order);
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
                    <p><ion-icon name="card-outline"></ion-icon> ${paymentMethod}</p>
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

        // Return a single top-level .order-card per order (no nested wrappers)
        return `
            <div class="order-card detailed">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                            ${order.status !== 'Cancelled' ? `
                                <div style="display:flex; gap:8px; align-items:center;">
                                    <div style="position:relative; display:inline-block;">
                                        <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select" style="padding:8px 36px 8px 12px;border-radius:8px;border:1px solid ${statusColor}40;background:${statusColor}20;color:${statusColor};font-weight:800;cursor:pointer;outline:none;-webkit-appearance:none;appearance:none;">
                                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                                            <option value="Shipping" ${order.status === 'Shipping' ? 'selected' : ''}>Shipping</option>
                                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                        </select>
                                        <span style="position:absolute; right:8px; top:50%; transform:translateY(-50%); pointer-events:none; display:flex; align-items:center;">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5" fill="none" stroke="${statusColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </span>
                                    </div>
                                    <button onclick="showOrderItems(${order.id})" class="action-btn" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.12);color:#6366f1;font-weight:700;">
                                        <ion-icon name="eye-outline"></ion-icon>
                                        View Items
                                    </button>
                                    <button onclick="deleteOrder(${order.id})" class="action-btn cancel-btn" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.18);color:#ef4444;font-weight:700;">
                                        <ion-icon name="close-circle-outline"></ion-icon>
                                        Cancel
                                    </button>
                                    ${isAdmin ? `<button onclick="deleteOrderPermanently(${order.id})" class="action-btn" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(17,24,39,0.2);background:rgba(17,24,39,0.6);color:#fff;font-weight:700;"><ion-icon name="trash-outline"></ion-icon>Delete</button>` : ''}
                                </div>
                            ` : `${isAdmin ? `<button onclick="deleteOrderPermanently(${order.id})" class="action-btn" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(17,24,39,0.2);background:rgba(17,24,39,0.6);color:#fff;font-weight:700;"><ion-icon name="trash-outline"></ion-icon>Delete</button>` : ''}`}
                        </div>
                    </div>
                </div>
                <div class="order-details" style="display:flex; justify-content:space-between; align-items:center; gap:20px; margin-top:16px;">
                    <div class="order-info">
                        <p style="margin:6px 0;"><ion-icon name="person-outline"></ion-icon> ${order.address.name}</p>
                        <p style="margin:6px 0;"><ion-icon name="location-outline"></ion-icon> ${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.zipCode || ''}</p>
                        <p style="margin:6px 0;"><ion-icon name="call-outline"></ion-icon> ${order.address.phone}</p>
                        <p style="margin:6px 0;"><ion-icon name="card-outline"></ion-icon> ${resolvePaymentLabel(order)}</p>
                    </div>
                    <div class="order-total" style="min-width:160px; text-align:right;">
                        <h3 style="color: #f8af1e; font-size: 1.6rem; margin:0; font-weight:800;">₱${(order.total || 0).toFixed(2)}</h3>
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
        // record when staff changed status
        orders[orderIndex].statusUpdatedAt = new Date().toISOString();

        // Persist locally first (authoritative local copy)
        localStorage.setItem('orders', JSON.stringify(orders));

        // Best-effort: also update the order remotely in Firebase if available
        try {
            if (window.firebaseDB) {
                const order = orders[orderIndex];
                const key = order.firebaseKey;

                // Prefer a dedicated update helper if available
                if (key && typeof window.firebaseDB.updateOrderRealtime === 'function') {
                    window.firebaseDB.updateOrderRealtime(key, order).catch(err => console.warn('Firebase updateOrderRealtime failed', err));
                }
                // Fallback to generic writeData helper (path is /orders/<key>)
                else if (key && typeof window.firebaseDB.writeData === 'function') {
                    try {
                        window.firebaseDB.writeData('/orders/' + key, order, { merge: true }).catch(err => console.warn('Firebase writeData(/orders/<key>) failed', err));
                    } catch (e) { console.warn('Firebase writeData call failed', e); }
                }
                // If we don't have a remote key yet, push as a new entry and save the returned key locally
                else if (!key && typeof window.firebaseDB.saveOrderRealtime === 'function') {
                    window.firebaseDB.saveOrderRealtime(order).then(newKey => {
                        if (!newKey) return;
                        try {
                            const stored = JSON.parse(localStorage.getItem('orders')) || [];
                            const idx = stored.findIndex(o => o.id === order.id);
                            if (idx !== -1) {
                                stored[idx].firebaseKey = newKey;
                                localStorage.setItem('orders', JSON.stringify(stored));
                            }
                        } catch (e) { console.warn('Failed to attach firebase key to order after push', e); }
                    }).catch(err => console.warn('Firebase saveOrderRealtime failed', err));
                }
            }
        } catch (e) {
            console.warn('Firebase order sync skipped', e);
        }

        showAlert('success', `Order #${orderId} status updated to ${newStatus}`);
        loadAllOrders();
        loadDashboardStats();
        // If the status changed to Cancelled, ensure analytics excludes this order immediately
        try { if (newStatus === 'Cancelled' && typeof loadAnalytics === 'function') loadAnalytics(); } catch (e) { console.warn('loadAnalytics call failed', e); }
    }
}

function deleteOrder(orderId) {
    // Staff/admin cancellation: mark order as Cancelled rather than deleting from storage
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || { name: 'Staff' };

    if (!confirm(`Are you sure you want to cancel Order #${orderId}? This will mark the order as cancelled.`)) {
        return;
    }

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        showAlert('error', `Order #${orderId} not found.`);
        return;
    }

    // Only proceed if not already cancelled
    if (orders[idx].status === 'Cancelled') {
        showAlert('error', `Order #${orderId} is already cancelled.`);
        return;
    }

    orders[idx].status = 'Cancelled';
    orders[idx].cancelledByStaff = true;
    orders[idx].cancelledBy = currentStaff.name || currentStaff.email || 'staff';
    orders[idx].cancelledDate = new Date().toISOString();

    // Persist updated orders
    localStorage.setItem('orders', JSON.stringify(orders));

    // Do not save cancelled orders into purchaseHistory. Keep cancelled orders only in `orders`.
    // Best-effort: also update the remote order status to Cancelled in Firebase when possible
    try {
        if (window.firebaseDB) {
            const order = orders[idx];
            const key = order.firebaseKey;

            if (key && typeof window.firebaseDB.updateOrderRealtime === 'function') {
                window.firebaseDB.updateOrderRealtime(key, order).catch(err => console.warn('Firebase updateOrderRealtime failed', err));
            } else if (key && typeof window.firebaseDB.writeData === 'function') {
                try {
                    window.firebaseDB.writeData('/orders/' + key, order, { merge: true }).catch(err => console.warn('Firebase writeData(/orders/<key>) failed', err));
                } catch (e) { console.warn('Firebase writeData call failed', e); }
            } else if (!key && typeof window.firebaseDB.saveOrderRealtime === 'function') {
                window.firebaseDB.saveOrderRealtime(order).then(newKey => {
                    if (!newKey) return;
                    try {
                        const stored = JSON.parse(localStorage.getItem('orders')) || [];
                        const idx2 = stored.findIndex(o => o.id === order.id);
                        if (idx2 !== -1) {
                            stored[idx2].firebaseKey = newKey;
                            localStorage.setItem('orders', JSON.stringify(stored));
                        }
                    } catch (e) { console.warn('Failed to attach firebase key to order after push', e); }
                }).catch(err => console.warn('Firebase saveOrderRealtime failed', err));
            }
        }
    } catch (e) { console.warn('Firebase cancel sync skipped', e); }

    showAlert('success', `Order #${orderId} has been cancelled.`);
    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
    // Recompute analytics (category-based sales) if analytics panel is open
    try { if (typeof loadAnalytics === 'function') loadAnalytics(); } catch (e) { console.warn('loadAnalytics call failed', e); }
}

// Permanently remove an order from storage (admin only)
function deleteOrderPermanently(orderId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || { role: 'staff' };
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Only administrators can permanently delete orders.');
        return;
    }

    if (!confirm(`Permanently delete Order #${orderId}? This cannot be undone.`)) return;

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        showAlert('error', `Order #${orderId} not found.`);
        return;
    }

    // Capture firebase key (if any) before removing locally
    const remoteKey = orders[idx].firebaseKey;
    orders.splice(idx, 1);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Best-effort: remove from remote DB if we have a push-key
    try {
        if (remoteKey && window.firebaseDB && typeof window.firebaseDB.deleteOrderByKey === 'function') {
            window.firebaseDB.deleteOrderByKey(remoteKey).catch(err => console.warn('Firebase deleteOrderByKey failed', err));
        }
    } catch (e) { console.warn('Firebase remote order deletion skipped', e); }

    showAlert('success', `Order #${orderId} permanently deleted.`);
    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
}

function getStatusColor(status) {
    switch(status) {
        case 'Processing': return '#f8af1e';
        case 'Preparing': return '#f59e0b';
        case 'Shipping': return '#3b82f6';
        case 'Delivered': return '#22c55e';
        case 'Cancelled': return '#ef4444';
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
    // Best-effort: push new menu item to Firebase and store returned key locally for reconciliation
    try {
        if (window.firebaseDB && typeof window.firebaseDB.saveMenuItemRealtime === 'function') {
            window.firebaseDB.saveMenuItemRealtime(newItem)
                .then(key => {
                    if (!key) return;
                    try {
                        const stored = JSON.parse(localStorage.getItem('menuItems')) || [];
                        const idx = stored.findIndex(i => i.id === newItem.id);
                        if (idx !== -1) {
                            stored[idx].firebaseKey = key;
                            localStorage.setItem('menuItems', JSON.stringify(stored));
                        }
                    } catch (e) { console.warn('Failed to attach firebase key to menu item', e); }
                })
                .catch(err => console.warn('Firebase saveMenuItemRealtime failed', err));
        }
    } catch (e) {
        console.warn('Firebase menu push skipped (not available)', e);
    }
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
            // Best-effort: update remote menu item if we have a firebaseKey, otherwise push a new entry and store its key
            try {
                if (window.firebaseDB) {
                    const item = menuItems[itemIndex];
                    const key = item.firebaseKey;
                    if (key && typeof window.firebaseDB.updateMenuItemRealtime === 'function') {
                        window.firebaseDB.updateMenuItemRealtime(key, item).catch(err => console.warn('Firebase updateMenuItemRealtime failed', err));
                    } else if (typeof window.firebaseDB.saveMenuItemRealtime === 'function') {
                        window.firebaseDB.saveMenuItemRealtime(item).then(newKey => {
                            if (!newKey) return;
                            try {
                                const stored = JSON.parse(localStorage.getItem('menuItems')) || [];
                                const idx2 = stored.findIndex(i => i.id === item.id);
                                if (idx2 !== -1) {
                                    stored[idx2].firebaseKey = newKey;
                                    localStorage.setItem('menuItems', JSON.stringify(stored));
                                }
                            } catch (e) { console.warn('Failed to attach firebase key after update', e); }
                        }).catch(err => console.warn('Firebase saveMenuItemRealtime failed', err));
                    }
                }
            } catch (e) { console.warn('Firebase menu update skipped', e); }
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
        // Best-effort: sync availability change to Firebase (update if key exists else create)
        try {
            if (window.firebaseDB) {
                const item = menuItems[itemIndex];
                if (item.firebaseKey && typeof window.firebaseDB.updateMenuItemRealtime === 'function') {
                    window.firebaseDB.updateMenuItemRealtime(item.firebaseKey, item).catch(err => console.warn('Firebase updateMenuItemRealtime failed', err));
                } else if (typeof window.firebaseDB.saveMenuItemRealtime === 'function') {
                    window.firebaseDB.saveMenuItemRealtime(item).then(newKey => {
                        if (!newKey) return;
                        try {
                            const stored = JSON.parse(localStorage.getItem('menuItems')) || [];
                            const idx2 = stored.findIndex(i => i.id === item.id);
                            if (idx2 !== -1) { stored[idx2].firebaseKey = newKey; localStorage.setItem('menuItems', JSON.stringify(stored)); }
                        } catch (e) { console.warn('Failed to attach firebase key after availability toggle', e); }
                    }).catch(err => console.warn('Firebase saveMenuItemRealtime failed', err));
                }
            }
        } catch (e) { console.warn('Firebase availability sync skipped', e); }
    }
}

function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    // Find the item and capture firebaseKey if present
    const item = menuItems.find(i => i.id === itemId);
    const remoteKey = item ? item.firebaseKey : null;

    menuItems = menuItems.filter(i => i.id !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));

    // Best-effort: delete remote menu item by key if available; otherwise mark deletion for reconciliation
    try {
        if (remoteKey && window.firebaseDB && typeof window.firebaseDB.deleteMenuItemByKey === 'function') {
            window.firebaseDB.deleteMenuItemByKey(remoteKey).catch(err => console.warn('Firebase deleteMenuItemByKey failed', err));
        } else if (window.firebaseDB && typeof window.firebaseDB.markMenuItemDeleted === 'function') {
            // fallback: log deletion for reconciliation if no push-key
            window.firebaseDB.markMenuItemDeleted(itemId).catch(err => console.warn('Firebase markMenuItemDeleted failed', err));
        }
    } catch (e) { console.warn('Firebase menu deletion skipped', e); }

    showAlert('success', 'Menu item deleted successfully!');
    loadMenuItems();
    loadDashboardStats();
    // Best-effort: mark deletion in Firebase so admins can reconcile remote records
    try {
        if (window.firebaseDB && typeof window.firebaseDB.markMenuItemDeleted === 'function') {
            window.firebaseDB.markMenuItemDeleted(itemId).catch(err => console.warn('Firebase markMenuItemDeleted failed', err));
        }
    } catch (e) { console.warn('Firebase markMenuItemDeleted skipped', e); }
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
    // Capture remote key if present
    const user = users[index];
    const remoteKey = user ? user.firebaseKey : null;

    users.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(users));

    // Best-effort: delete remote user by push-key if available. Do NOT create/delete by email here.
    try {
        if (remoteKey && window.firebaseDB && typeof window.firebaseDB.deleteUserByKey === 'function') {
            window.firebaseDB.deleteUserByKey(remoteKey).catch(err => console.warn('Firebase deleteUserByKey failed', err));
        }
    } catch (e) { console.warn('Firebase remote user deletion skipped', e); }

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

// Show a modal listing ordered items for a given order id
function showOrderItems(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showAlert('error', 'Order not found.');
        return;
    }

    const items = order.items || order.cart || [];
    // load admin-managed menu items to fall back to canonical metadata when needed
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #f8af1e;">
                <h2 style="color:#f8af1e; margin:0; font-size:1.5rem; display:flex; align-items:center; gap:10px;"><ion-icon name="cube-outline" style="font-size:1.6rem"></ion-icon> Ordered Items</h2>
                <button onclick="closeOrderItemsModal()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div style="flex:1; overflow-y:auto;">
    `;

    if (!items || items.length === 0) {
        html += `
            <div style="text-align:center; padding:40px; color: rgba(255,255,255,0.7);">
                <ion-icon name="help-circle-outline" style="font-size:3rem; margin-bottom:10px;"></ion-icon>
                <p>No item details saved for this order.</p>
            </div>
        `;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
        items.forEach(it => {
            // Resolve price: prefer numeric fields on the order item, then fall back to menuItems by id/name
            let price = 0;
            try {
                price = parseFloat(String(it.price || it.unitPrice || '').replace(/[^0-9.-]+/g, ''));
                if (Number.isNaN(price) || !isFinite(price) || price === 0) {
                    const match = menuItems.find(m => (m.id && it.id && m.id === it.id) || (m.name && it.name && m.name.toLowerCase() === it.name.toLowerCase()));
                    if (match && match.price !== undefined && match.price !== null) {
                        price = parseFloat(String(match.price).replace(/[^0-9.-]+/g, '')) || 0;
                    }
                }
            } catch (e) {
                price = 0;
            }

            // Resolve quantity from several possible fields
            const qty = Number(it.quantity || it.qty || it.count) || 1;
            const itemTotal = (price * qty).toFixed(2);
            html += `
                <div style="background: rgba(255,255,255,0.03); padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:12px; align-items:center; min-width:0;">
                        <img src="${it.image || '../static/images/placeholder.jpg'}" alt="${it.name}" style="width:56px; height:56px; object-fit:cover; border-radius:8px;">
                        <div style="min-width:0;">
                            <div style="font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name}</div>
                            <div style="color:rgba(255,255,255,0.65); font-size:0.9rem;">₱${(price).toFixed(2)} &times; ${qty}</div>
                        </div>
                    </div>
                    <div style="font-weight:700; color:#f8af1e;">₱${itemTotal}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
            </div>
    `;

    // Compute amounts (use saved values when available, otherwise derive)
    const subtotal = (typeof order.subtotal === 'number') ? order.subtotal : (() => {
        let s = 0;
        (items || []).forEach(it => {
            const price = parseFloat(String(it.price || it.unitPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
            const qty = it.quantity || 1;
            s += price * qty;
        });
        return parseFloat(s.toFixed(2));
    })();
    const shippingFee = (typeof order.shippingFee === 'number') ? order.shippingFee : (typeof getShippingFee === 'function' ? getShippingFee() : 0);
    const total = (typeof order.total === 'number') ? order.total : parseFloat((subtotal + shippingFee).toFixed(2));

    // Summary block: Subtotal, Shipping Fee, Total
    html += `
            <div style="margin-top:16px; padding:14px; border-top:1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); border-radius: 10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <div style="color:rgba(255,255,255,0.8)">Subtotal</div>
                    <div style="color:#f8af1e; font-weight:700">₱${subtotal.toFixed(2)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <div style="color:rgba(255,255,255,0.8)">Shipping Fee</div>
                    <div style="color:#f8af1e; font-weight:700">₱${shippingFee.toFixed(2)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.04);">
                    <div style="color:white; font-weight:700">Total</div>
                    <div style="color:#f8af1e; font-weight:900; font-size:1.1rem">₱${total.toFixed(2)}</div>
                </div>
            </div>
    `;

    html += `
            <div style="display:flex; gap:10px; margin-top:12px;">
                <button onclick="showReceiptModalAdmin(${order.id})" style="background:transparent; color:#f8af1e; border:1px solid #f8af1e; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">View Receipt</button>
                <button onclick="closeOrderItemsModal()" style="background:#f8af1e; color:#000; border:none; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">Close</button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'orderItemsModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeOrderItemsModal(); });
    document.body.appendChild(modal);
}

function closeOrderItemsModal() { const m = document.getElementById('orderItemsModal'); if (m) m.remove(); }

// Receipt helpers for admin/staff dashboard
function renderReceiptHTMLAdmin(order) {
        const items = order.items || order.cart || [];
        const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
        const address = order.address || {};
        const date = new Date(order.date || order.createdAt || Date.now()).toLocaleString();

        // Compute rows and subtotal from resolved item prices so totals match shown rows
        let computedSubtotal = 0;
        const rows = (items || []).map(it => {
                let price = 0;
                try { price = parseFloat(String(it.price ?? it.unitPrice ?? '').replace(/[^0-9.-]+/g, '')) || 0; } catch (e) { price = 0; }
                if (!price) {
                    try {
                        const match = menuItems.find(m => (m.id && it.id && m.id === it.id) || (m.name && it.name && m.name.toLowerCase() === String(it.name || '').toLowerCase()));
                        if (match && match.price !== undefined && match.price !== null) {
                            price = parseFloat(String(match.price).replace(/[^0-9.-]+/g, '')) || 0;
                        }
                    } catch (e) { /* ignore */ }
                }
                const qty = Number(it.quantity || it.qty || it.count) || 1;
                const itemSubtotal = parseFloat((price * qty).toFixed(2));
                computedSubtotal += itemSubtotal;
                return `<tr>
                        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtmlAdmin(it.name || '')}</td>
                        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">₱${price.toFixed(2)}</td>
                        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
                        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">₱${itemSubtotal.toFixed(2)}</td>
                </tr>`;
        }).join('');

        const shipping = Number(order.shippingFee) || 0;
        const subtotal = parseFloat(computedSubtotal.toFixed(2));
        const total = Number(order.total) || parseFloat((subtotal + shipping).toFixed(2));

            return `
            <div style="font-family: Arial, Helvetica, sans-serif; color:#000; padding:20px; width:720px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                    <img src="/static/images/logo.png" alt="Logo" style="width:64px;height:64px;object-fit:contain;border-radius:8px;" onerror="this.src='/static/images/placeholder.jpg'">
                            <div>
                                <div style="font-size:18px;font-weight:800;color:#111;">Dimsum by Luna</div>
                                <div style="font-size:12px;color:#666;">Order Receipt</div>
                            </div>
                </div>
                <h2 style="margin:0 0 6px 0; color:#f8af1e;">Order #${order.id}</h2>
                <div style="margin-bottom:12px; color:#444">${date}</div>
                <div style="display:flex; gap:20px; margin-bottom:12px;">
                <div style="flex:1">
                    <strong>Customer</strong><br>
                    ${(order.customerName || address.name || '')}<br>
                    ${(order.customerEmail || '')}
                </div>
                <div style="flex:1">
                    <strong>Shipping</strong><br>
                    ${escapeHtmlAdmin(address.address || '')}<br>
                    ${escapeHtmlAdmin((address.city || '') + (address.state ? ', ' + address.state : ''))}
                </div>
            </div>
            <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
                <thead>
                    <tr>
                        <th style="text-align:left; padding:6px 8px; border-bottom:2px solid #ddd;">Item</th>
                        <th style="text-align:right; padding:6px 8px; border-bottom:2px solid #ddd;">Unit</th>
                        <th style="text-align:center; padding:6px 8px; border-bottom:2px solid #ddd;">Qty</th>
                        <th style="text-align:right; padding:6px 8px; border-bottom:2px solid #ddd;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <div style="display:flex; justify-content:flex-end; gap:12px; font-weight:700;">
                <div style="text-align:right; min-width:200px;">
                    <div style="display:flex; justify-content:space-between; padding:4px 0; color:#444;"><span>Subtotal</span><span>₱${subtotal.toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; padding:4px 0; color:#444;"><span>Shipping</span><span>₱${shipping.toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid #ddd; margin-top:6px; color:#000;"><span>Total</span><span>₱${total.toFixed(2)}</span></div>
                </div>
            </div>
            <div style="margin-top:14px; color:#666; font-size:0.9rem;">Thank you for your order!</div>
        </div>`;
}

function escapeHtmlAdmin(str) { return String(str || '').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }

function showReceiptModalAdmin(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) { showAlert('error','Order not found'); return; }
        const receiptHtml = renderReceiptHTMLAdmin(order);
        const html = `
                <div id="receiptModalAdmin" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;">
                        <div style="background:#fff; border-radius:12px; max-height:90vh; overflow:auto; padding:14px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
                                        <h3 style="margin:0;">Receipt - Order #${order.id}</h3>
                    <div>
                        <button onclick="downloadReceiptPdfAdmin(${order.id})" style="margin-right:8px; padding:8px 12px; border-radius:8px; background:#f8af1e; border:none; font-weight:700; cursor:pointer;">Print Receipt</button>
                        <button onclick="closeReceiptModalAdmin()" style="padding:8px 12px; border-radius:8px; background:transparent; border:1px solid #ccc; cursor:pointer;">Close</button>
                    </div>
                                </div>
                                <div id="receiptContentAdmin">${receiptHtml}</div>
                        </div>
                </div>`;
        const existing = document.getElementById('receiptModalAdmin'); if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
}

function closeReceiptModalAdmin(){ const m = document.getElementById('receiptModalAdmin'); if (m) m.remove(); }

function downloadReceiptPdfAdmin(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) { showAlert('error','Order not found'); return; }
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${order.id}</title></head><body>${renderReceiptHTMLAdmin(order)}</body></html>`;
        const w = window.open('', '_blank');
        if (!w) { showAlert('error', 'Popup blocked. Please allow popups to download the PDF.'); return; }
        w.document.open();
        w.document.write(html);
        w.document.close();
        setTimeout(()=>{ w.focus(); w.print(); }, 500);
}
