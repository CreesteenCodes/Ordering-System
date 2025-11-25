// ============================================
// RESPONSIVE MENU TOGGLE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    // Toggle menu on click
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            
            // Toggle icon between menu and close
            const icon = menuToggle.querySelector('ion-icon');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('name', 'close-outline');
            } else {
                icon.setAttribute('name', 'menu-outline');
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navLinks && navLinks.classList.contains('active')) {
            const isClickInsideNav = navLinks.contains(event.target);
            const isClickOnToggle = menuToggle && menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('ion-icon');
                if (icon) icon.setAttribute('name', 'menu-outline');
            }
        }
    });
    
    // Close mobile menu when clicking on a link
    if (navLinks) {
        const navLinksItems = navLinks.querySelectorAll('a:not(.dropdown-toggle)');
        navLinksItems.forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't close navbar if clicking inside dropdown menus
                if (link.closest('.dropdown-menu') || link.closest('.dropdown')) {
                    return;
                }
                
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            });
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#top') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// HERO SECTION - ORDER NOW BUTTON
// ============================================

// Helper function to get correct path based on current location
function getCorrectPath(filename) {
    // Check if we're in the templates folder or root
    const isInTemplates = window.location.pathname.includes('/templates/');
    if (isInTemplates) {
        // We're in templates folder, need to go up one level
        if (filename === 'index.html' || filename === 'admin_staff.html') {
            return '../' + filename;
        }
        return filename; // For files in templates folder
    } else {
        // We're in root folder
        if (filename === 'index.html' || filename === 'admin_staff.html') {
            return filename; // Files in root
        }
        return 'templates/' + filename; // Files in templates folder
    }
}

// Order Now button functionality
document.addEventListener('DOMContentLoaded', function() {
    const orderBtn = document.querySelector('.order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn === 'true') {
                // Scroll to menu section
                const menuSection = document.querySelector('.menu-section');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // If not on homepage, redirect to menu page
                    window.location.href = getCorrectPath('menu.html') + '#menu';
                }
            } else {
                showAlert('error', 'Please login to place an order!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
            }
        });
    }
});

// ============================================
// AUTHENTICATION SYSTEM
// ============================================

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeCart();
    normalizeExistingOrders();
    
    // Enable menu dropdown (not account) to open on click for mobile/desktop
    document.querySelectorAll('.dropdown:not(.account-dropdown) > .dropdown-toggle').forEach(function(toggle) {
        // Allow link to work normally (navigate to menu.html) but also toggle dropdown
        toggle.addEventListener('click', function(e) {
            const parent = this.parentElement;
            
            // On mobile (<=768px), always prevent default and toggle dropdown
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other menu dropdowns first
                document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                    if (drop !== parent) {
                        drop.classList.remove('open');
                    }
                });
                
                // Toggle this dropdown
                parent.classList.toggle('open');
            }
            // On desktop, only toggle if clicking chevron icon
            else if (e.target.tagName === 'ION-ICON' || e.target.closest('ion-icon')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other menu dropdowns first
                document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                    if (drop !== parent) {
                        drop.classList.remove('open');
                    }
                });
                
                // Toggle this dropdown
                parent.classList.toggle('open');
            }
            // On desktop, clicking the link text navigates to menu.html (default behavior)
        });
    });
    
    // Close menu dropdown when clicking outside (both mobile and desktop)
    document.addEventListener('click', function(e) {
        const isDropdownClick = e.target.closest('.dropdown:not(.account-dropdown)');
        if (!isDropdownClick) {
            document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                drop.classList.remove('open');
            });
        }
    });
});

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    // Update navigation based on login status
    // Find all login links regardless of their href pattern
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    loginLinks.forEach(link => {
        if (link.textContent.trim() === 'Login' && isLoggedIn === 'true') {
            const userName = currentUser ? JSON.parse(currentUser).name.split(' ')[0] : 'Account';

            // Build a dedicated wrapper for the account dropdown so only the account area triggers it
            const accountWrapper = document.createElement('div');
            accountWrapper.className = 'dropdown account-dropdown';

            // Prepare the existing link to act as the dropdown toggle
            link.textContent = userName;
            link.href = '#';
            link.classList.add('dropdown-toggle');
            link.onclick = function(e) {
                e.preventDefault();
                // Toggle .open class for dropdown on click (mobile/desktop)
                accountWrapper.classList.toggle('open');
            };

            // Add dropdown chevron icon
            const icon = document.createElement('ion-icon');
            icon.name = 'chevron-down-outline';
            icon.style.marginLeft = '5px';
            link.appendChild(icon);

            // Create dropdown menu
            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.innerHTML = `
                <a href="#" onclick="showAccountDetails(); return false;">
                    <ion-icon name="person-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Account Details
                </a>
                <a href="#" onclick="showOrderStatus(); return false;">
                    <ion-icon name="receipt-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Order Status
                </a>
                <a href="#" onclick="showPurchaseHistory(); return false;">
                    <ion-icon name="bag-check-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Purchase History
                </a>
                <a href="#" onclick="showCancelledOrders(); return false;">
                    <ion-icon name="close-circle-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Cancelled Orders
                </a>
                <a href="#" onclick="handleLogout(); return false;" style="color: #ef4444;">
                    <ion-icon name="log-out-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Logout
                </a>
            `;

            // Replace the original link with the new wrapper that contains the link and menu
            const parent = link.parentElement;
            parent.replaceChild(accountWrapper, link);
            accountWrapper.appendChild(link);
            accountWrapper.appendChild(dropdownMenu);

            // Close dropdown when clicking outside the wrapper
            document.addEventListener('click', function handleDropdownClose(event) {
                if (!accountWrapper.contains(event.target)) {
                    accountWrapper.classList.remove('open');
                }
            });
        }
    });
    
    // Protect order functionality
    const addBtns = document.querySelectorAll('.add-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (isLoggedIn !== 'true') {
                e.preventDefault();
                showAlert('error', 'Please login or sign up to place an order!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
            } else {
                // Get item details
                const card = this.closest('.menu-card');
                const itemName = card.querySelector('h3').textContent;
                const itemPrice = card.querySelector('.price').textContent;
                const itemImage = card.querySelector('img').src;
                
                // Block if item is unavailable (synced from admin dashboard)
                if (!isMenuItemAvailableByName(itemName)) {
                    e.preventDefault();
                    showAlert('error', 'Sorry, this item is currently unavailable.');
                    // Refresh UI to reflect disabled state just in case
                    applyAvailabilityUI();
                    return;
                }
                
                // Add to cart
                addToCart({
                    name: itemName,
                    price: itemPrice,
                    image: itemImage
                });
                
                showAlert('success', `${itemName} added to cart!`);
            }
        });
    });
    
    // Protect cart functionality
    const cartIcon = document.querySelector('.icons ion-icon[name="cart-outline"]');
    if (cartIcon) {
        cartIcon.parentElement.style.cursor = 'pointer';
        cartIcon.parentElement.addEventListener('click', function() {
            if (isLoggedIn !== 'true') {
                showAlert('error', 'Please login to view your cart!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
            } else {
                viewCart();
            }
        });
        
        // Update cart badge
        updateCartBadge();
    }
}

// Toggle between login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
        
        // Clear any existing alerts
        const existingAlerts = document.querySelectorAll('.alert-message');
        existingAlerts.forEach(alert => alert.remove());
    }
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Get stored users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Login successful
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email
        }));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        showAlert('success', 'Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = getCorrectPath('index.html');
        }, 1500);
    } else {
        showAlert('error', 'Invalid email or password!');
    }
    
    return false;
}

// Handle Signup
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('error', 'Passwords do not match!');
        return false;
    }
    
    if (password.length < 6) {
        showAlert('error', 'Password must be at least 6 characters!');
        return false;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showAlert('error', 'Email already registered!');
        return false;
    }
    
    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({
        name: newUser.name,
        email: newUser.email
    }));

    // Also try saving to Firebase Realtime Database if the helper is available
    try {
        if (window.firebaseDB && typeof window.firebaseDB.saveUserRealtime === 'function') {
            // Do not await — fire-and-forget to avoid blocking the UI
            window.firebaseDB.saveUserRealtime(newUser).catch(err => console.warn('Firebase saveUserRealtime failed', err));
        }
    } catch (e) {
        console.warn('saveUserRealtime call error', e);
    }
    
    showAlert('success', 'Account created successfully! Redirecting...');
    
    setTimeout(() => {
    window.location.href = getCorrectPath('index.html');
    }, 1500);
    
    return false;
}

// Show Account Details
function showAccountDetails() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showAlert('error', 'Please login to view account details!');
        return;
    }
    
    const accountHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="person-outline" style="font-size: 2rem;"></ion-icon>
                    Account Details
                </h2>
                <button onclick="closeAccountModal()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #f8af1e, #e48a0a);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #000;
                    ">
                        ${currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="color: white; margin: 0 0 5px 0; font-size: 1.5rem;">${currentUser.name}</h3>
                        <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 0.95rem;">Member</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="color: rgba(255,255,255,0.6); font-size: 0.85rem; display: block; margin-bottom: 5px;">Full Name</label>
                        <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 500;">${currentUser.name}</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="color: rgba(255,255,255,0.6); font-size: 0.85rem; display: block; margin-bottom: 5px;">Email Address</label>
                        <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 500;">${currentUser.email}</p>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button onclick="showAccountEditForm()" style="
                    background: transparent;
                    color: #f8af1e;
                    border: 1px solid #f8af1e;
                    padding: 12px 18px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex:1;
                " onmouseover="this.style.background='#f8af1e'; this.style.color='#000'" onmouseout="this.style.background='transparent'; this.style.color='#f8af1e'">Edit</button>

                <button onclick="closeAccountModal()" style="
                    background: #f8af1e;
                    color: #000;
                    border: none;
                    padding: 12px 18px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex:1;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'accountModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = accountHTML;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAccountModal();
        }
    });
    
    document.body.appendChild(modal);
}

function closeAccountModal() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.remove();
    }
}

// Show Edit Account modal where customer can change name, password, and default address
function showAccountEditForm() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to edit account details.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;
    const savedAddresses = JSON.parse(localStorage.getItem(addressesKey)) || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #f8af1e;">
                <h2 style="color:#f8af1e; margin:0; font-size:1.5rem; display:flex; align-items:center; gap:10px;"><ion-icon name="create-outline" style="font-size:1.6rem"></ion-icon> Edit Account</h2>
                <button onclick="closeAccountEditModal()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div style="flex:1; overflow-y:auto; padding-right:8px;">
                <form id="accountEditForm" onsubmit="saveAccountEdits(event)">
                    <div style="margin-bottom:12px;">
                        <label style="color: rgba(255,255,255,0.8); display:block; margin-bottom:6px;">Full Name *</label>
                        <input id="edit_name" type="text" required style="width:100%; padding:12px 14px; height:42px; box-sizing:border-box; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color: white; font-size:1rem; outline:none;" value="${currentUser.name}">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="color: rgba(255,255,255,0.8); display:block; margin-bottom:6px;">Current Password (required to change password)</label>
                        <input id="edit_current_password" type="password" placeholder="Enter current password" style="width:100%; padding:12px 14px; height:42px; box-sizing:border-box; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color: white; font-size:1rem; outline:none;">
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                        <div>
                            <label style="color: rgba(255,255,255,0.8); display:block; margin-bottom:6px;">New Password</label>
                            <input id="edit_new_password" type="password" placeholder="New password (min 6 chars)" style="width:100%; padding:12px 14px; height:42px; box-sizing:border-box; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color: white; font-size:1rem; outline:none;">
                        </div>
                        <div>
                            <label style="color: rgba(255,255,255,0.8); display:block; margin-bottom:6px;">Confirm New Password</label>
                            <input id="edit_confirm_password" type="password" placeholder="Confirm new password" style="width:100%; padding:12px 14px; height:42px; box-sizing:border-box; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color: white; font-size:1rem; outline:none;">
                        </div>
                    </div>

                    <div style="margin-bottom:12px;">
                        <h4 style="color:white; margin:0 0 8px 0;">Saved Addresses (select default)</h4>
                        <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
    `;

    if (savedAddresses.length === 0) {
        html += `<div style="color:rgba(255,255,255,0.7);">No saved addresses yet.</div>`;
    } else {
        savedAddresses.forEach((addr, i) => {
            html += `
                <label style="background: rgba(255,255,255,0.03); padding:10px; border-radius:8px; display:flex; align-items:center; gap:12px;">
                    <input type="radio" name="default_address" value="${i}" ${addr.isDefault ? 'checked' : ''} style="width:16px; height:16px;" />
                    <div style="color:rgba(255,255,255,0.85)">
                        <div style="font-weight:700">${addr.name}</div>
                        <div style="color:rgba(255,255,255,0.65); font-size:0.9rem;">${addr.address}, ${addr.city}, ${addr.state}</div>
                    </div>
                </label>
            `;
        });
    }

    html += `
                        </div>
                    </div>

                    <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:nowrap; justify-content:flex-end; align-items:center; width:100%;">
                        <button type="submit" style="background:#f8af1e; color:#000; border:none; height:44px; padding:0 20px; display:flex; align-items:center; justify-content:center; box-sizing:border-box; border-radius:10px; font-weight:700; cursor:pointer; font-size:1rem; white-space:nowrap; line-height:1; vertical-align:middle; align-self:center; margin:0;">
                            Save Changes
                        </button>
                        <button type="button" onclick="closeAccountEditModal()" style="background:transparent; color:#f8af1e; border:2px solid #f8af1e; height:44px; padding:0 20px; display:flex; align-items:center; justify-content:center; box-sizing:border-box; border-radius:10px; font-weight:700; cursor:pointer; font-size:1rem; white-space:nowrap; line-height:1; vertical-align:middle; align-self:center; margin:0;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'accountEditModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e){ if (e.target === modal) closeAccountEditModal(); });
    document.body.appendChild(modal);
}

function closeAccountEditModal() {
    const m = document.getElementById('accountEditModal');
    if (m) m.remove();
}

// Save account edits: update users array, currentUser, and per-user addresses default flag
function saveAccountEdits(event) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to edit account.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIdx = users.findIndex(u => u.email === currentUser.email);
    if (userIdx === -1) {
        showAlert('error', 'User record not found.');
        return;
    }

    const name = (document.getElementById('edit_name') || {}).value || '';
    const currentPwInput = (document.getElementById('edit_current_password') || {}).value || '';
    const newPw = (document.getElementById('edit_new_password') || {}).value || '';
    const confirmPw = (document.getElementById('edit_confirm_password') || {}).value || '';

    // If user wants to change password, validate current and new
    if (newPw) {
        const storedPw = users[userIdx].password || '';
        if (!currentPwInput) {
            showAlert('error', 'Please provide your current password to change it.');
            return;
        }
        if (storedPw !== currentPwInput) {
            showAlert('error', 'Current password is incorrect.');
            return;
        }
        if (newPw.length < 6) {
            showAlert('error', 'New password must be at least 6 characters.');
            return;
        }
        if (newPw !== confirmPw) {
            showAlert('error', 'New password and confirmation do not match.');
            return;
        }
        // Update stored password
        users[userIdx].password = newPw;
    }

    // Update name (do not allow empty)
    if (!name || !name.trim()) {
        showAlert('error', 'Full name cannot be empty.');
        return;
    }
    users[userIdx].name = name.trim();

    // Persist users
    localStorage.setItem('users', JSON.stringify(users));

    // Update currentUser object
    const updatedCurrentUser = { name: users[userIdx].name, email: users[userIdx].email };
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));

    // Update addresses default selection
    const addressesKey = `shippingAddresses_${currentUser.email}`;
    let addresses = JSON.parse(localStorage.getItem(addressesKey)) || [];
    const selected = document.querySelector('input[name="default_address"]:checked');
    if (selected && addresses.length > 0) {
        const idx = parseInt(selected.value, 10);
        addresses = addresses.map((a, i) => ({ ...a, isDefault: i === idx }));
        localStorage.setItem(addressesKey, JSON.stringify(addresses));
    }

    // Update visible account dropdown name if present
    const accountToggle = document.querySelector('.account-dropdown .dropdown-toggle');
    if (accountToggle) {
        // Find first text node and update it (preserve the chevron icon child)
        for (let node of accountToggle.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = updatedCurrentUser.name.split(' ')[0];
                break;
            }
        }
    }

    closeAccountEditModal();
    closeAccountModal();
    showAlert('success', 'Account updated successfully.');

    // Attempt to update name/password in Firebase (best-effort). Do NOT create new user entries here.
    // Policy: if we have a firebaseKey locally, update that record; otherwise try to find a
    // remote user by email and update it. If no remote user is found, skip remote writes.
    try {
        const updatedUser = users[userIdx];
        if (window.firebaseDB) {
            const key = updatedUser.firebaseKey;

            // Helper to merge and write only the name/password to avoid clobbering other fields
            const mergeAndUpdate = async (remoteKey) => {
                try {
                    if (typeof window.firebaseDB.readData === 'function') {
                        const remote = await window.firebaseDB.readData('/users/' + remoteKey);
                        const merged = Object.assign({}, remote || {}, { name: updatedUser.name, password: updatedUser.password });
                        await window.firebaseDB.writeData('/users/' + remoteKey, merged);
                    } else {
                        // If readData is not available, best-effort write only name/password (may overwrite)
                        await window.firebaseDB.writeData('/users/' + remoteKey, { name: updatedUser.name, password: updatedUser.password });
                    }
                } catch (e) {
                    console.warn('Firebase merge/update failed for user', e);
                }
            };

            if (key) {
                // Update the remote record referenced by the local firebaseKey
                mergeAndUpdate(key);
            } else if (typeof window.firebaseDB.readUsers === 'function') {
                // Try to find an existing remote user by email and update it
                window.firebaseDB.readUsers().then(remoteUsers => {
                    try {
                        const found = (remoteUsers || []).find(r => r && r.email && updatedUser.email && r.email.toLowerCase() === updatedUser.email.toLowerCase());
                        if (found && found.firebaseKey) {
                            mergeAndUpdate(found.firebaseKey).then(() => {
                                // Persist the found key locally so future edits go straight to it
                                try {
                                    const stored = JSON.parse(localStorage.getItem('users')) || [];
                                    const idx2 = stored.findIndex(u => u.email === updatedUser.email);
                                    if (idx2 !== -1) {
                                        stored[idx2].firebaseKey = found.firebaseKey;
                                        localStorage.setItem('users', JSON.stringify(stored));
                                    }
                                } catch (e) { console.warn('Failed to attach found firebase key to user', e); }
                            }).catch(err => console.warn('Firebase update (found user) failed', err));
                        } else {
                            // No remote match: intentionally do nothing to avoid creating duplicates
                            console.info('No remote user found for email; skipping creating a new remote user to avoid duplicates.');
                        }
                    } catch (e) {
                        console.warn('Error while reconciling remote users', e);
                    }
                }).catch(err => {
                    console.warn('Firebase readUsers failed — cannot reconcile remote user by email', err);
                });
            } else {
                // No way to resolve remote user — skip to avoid creating duplicates
                console.info('Firebase helpers do not support readUsers; skipping remote user update to avoid duplicates.');
            }
        }
    } catch (e) {
        console.warn('Firebase user sync skipped', e);
    }
}

// Show Order Status
function showOrderStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to view your orders.');
        return;
    }

    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];

    // Only show orders that belong to the current user, that were not confirmed received,
    // and exclude orders that were cancelled so they don't appear in Order Status
    const orders = allOrders.filter(order => order.customerEmail === currentUser.email && !order.confirmedReceived && order.status !== 'Cancelled');
    
    let orderHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="receipt-outline" style="font-size: 2rem;"></ion-icon>
                    Order Status
                </h2>
                <button onclick="closeOrderStatusModal()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
    `;
    
    if (orders.length === 0) {
        orderHTML += `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="receipt-outline" style="
                    font-size: 5rem;
                    color: rgba(248, 175, 30, 0.3);
                    margin-bottom: 20px;
                "></ion-icon>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 10px;">
                    No Orders Yet
                </h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-bottom: 30px; font-size: 1rem;">
                    You haven't placed any orders yet. Start ordering now!
                </p>
                <button onclick="closeOrderStatusModal()" style="
                    background: #f8af1e; 
                    color: #000; 
                    border: none; 
                    padding: 15px 30px; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    cursor: pointer;
                    font-size: 1rem;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    Browse Menu
                </button>
            </div>
        `;
    } else {
        orderHTML += `<div style="flex: 1; overflow-y: auto; padding-right: 8px; margin-right: -8px;">`;
        
        orders.reverse().forEach((order, index) => {
            const orderDate = new Date(order.date);
            const statusColor = order.status === 'Delivered' ? '#22c55e' : 
                               order.status === 'Shipping' ? '#3b82f6' : '#f8af1e';
            // Determine payment method display (use helper)
            const methodIconMap = { gcash: 'wallet-outline', maya: 'phone-portrait-outline', paypal: 'logo-paypal' };
            const methodId = order.paymentMethodId || null;
            const methodLabel = resolvePaymentLabel(order);
            const methodIcon = methodIconMap[methodId] || 'card-outline';
            
            orderHTML += `
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 0.85rem;">Order #${order.id}</p>
                            <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;">₱${order.total.toFixed(2)}</p>
                        </div>
                        <span style="
                            background: ${statusColor}20;
                            color: ${statusColor};
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 0.85rem;
                            font-weight: 600;
                            border: 1px solid ${statusColor}40;
                        ">
                            ${order.status}
                        </span>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                            <ion-icon name="calendar-outline" style="vertical-align: middle;"></ion-icon>
                            ${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                            <ion-icon name="${methodIcon}" style="vertical-align: middle;"></ion-icon>
                            ${methodLabel}
                        </p>
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                            <ion-icon name="location-outline" style="vertical-align: middle;"></ion-icon>
                            ${order.address.city}, ${order.address.state}
                        </p>
                    </div>
                    ${order.status === 'Delivered' ? `<div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="confirmReceived(${order.id})" style="background:#22c55e;color:#000;border:none;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">Confirm Received</button>
                        <button onclick="showOrderItemsCustomer(${order.id})" style="background:transparent;color:#f8af1e;border:1px solid #f8af1e;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">View Items</button>
                    </div>` : (order.status === 'Processing') ? `<div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="showOrderItemsCustomer(${order.id})" style="background:transparent;color:#f8af1e;border:1px solid #f8af1e;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">View Items</button>
                        <button onclick="cancelOrder(${order.id})" style="background:#ef4444;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">Cancel Order</button>
                    </div>` : `<div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="showOrderItemsCustomer(${order.id})" style="background:transparent;color:#f8af1e;border:1px solid #f8af1e;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">View Items</button>
                    </div>`}
                </div>
            `;
        });
        
        orderHTML += `</div>`;
    }
    
    orderHTML += `
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'orderStatusModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = orderHTML;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeOrderStatusModal();
        }
    });
    
    document.body.appendChild(modal);
}

function closeOrderStatusModal() {
    const modal = document.getElementById('orderStatusModal');
    if (modal) {
        modal.remove();
    }
}

// Customer: show ordered items for a specific order
function showOrderItemsCustomer(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showAlert('error', 'Order not found.');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to view order details.');
        return;
    }
    // Prevent viewing other users' orders
    if (order.customerEmail && order.customerEmail !== currentUser.email) {
        showAlert('error', 'You are not authorized to view this order.');
        return;
    }

    const items = order.items || order.cart || [];
    // Load admin-managed menu items so we can fall back to canonical metadata
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #f8af1e;">
                <h2 style="color:#f8af1e; margin:0; font-size:1.5rem; display:flex; align-items:center; gap:10px;"><ion-icon name="cube-outline" style="font-size:1.6rem"></ion-icon> Ordered Items</h2>
                <button onclick="closeOrderItemsModalCustomer()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
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
                // Try obvious fields first
                price = parseFloat(String(it.price || it.unitPrice || '').replace(/[^0-9.-]+/g, ''));
                if (Number.isNaN(price) || !isFinite(price) || price === 0) {
                    // Attempt to find matching menu item metadata
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
            const qty = Number(it.quantity || it.qty || it.count) || 1;
            s += price * qty;
        });
        return parseFloat(s.toFixed(2));
    })();
    const shippingFee = (typeof order.shippingFee === 'number') ? order.shippingFee : getShippingFee(order.address);
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
                <button onclick="showReceiptModalCustomer(${order.id})" style="background:transparent; color:#f8af1e; border:1px solid #f8af1e; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">View Receipt</button>
                <button onclick="closeOrderItemsModalCustomer()" style="background:#f8af1e; color:#000; border:none; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">Close</button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'orderItemsModalCustomer';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeOrderItemsModalCustomer(); });
    document.body.appendChild(modal);
}

function closeOrderItemsModalCustomer() { const m = document.getElementById('orderItemsModalCustomer'); if (m) m.remove(); }

// Receipt rendering and download helpers for customer
function renderReceiptHTML(order) {
        const items = order.items || order.cart || [];
        const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
        const address = order.address || {};
        const date = new Date(order.date || order.createdAt || Date.now()).toLocaleString();

        // Build rows and compute subtotal from row data so display always matches shown item rows
        let computedSubtotal = 0;
        const rows = (items || []).map(it => {
                // Resolve price with fallbacks: order item fields first, then admin-managed menuItems
                let price = 0;
                try {
                    price = parseFloat(String(it.price ?? it.unitPrice ?? '').replace(/[^0-9.-]+/g, '')) || 0;
                } catch (e) { price = 0; }

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
                        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtml(it.name || '')}</td>
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
                    ${escapeHtml(address.address || '')}<br>
                    ${escapeHtml((address.city || '') + (address.state ? ', ' + address.state : ''))}
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

function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }

function showReceiptModalCustomer(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) { showAlert('error','Order not found'); return; }

        const receiptHtml = renderReceiptHTML(order);
        const html = `
                <div id="receiptModalCustomer" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;">
                        <div style="background:#fff; border-radius:12px; max-height:90vh; overflow:auto; padding:14px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
                                        <h3 style="margin:0;">Receipt - Order #${order.id}</h3>
                                        <div>
                                                <button onclick="downloadReceiptPdfCustomer(${order.id})" style="margin-right:8px; padding:8px 12px; border-radius:8px; background:#f8af1e; border:none; font-weight:700; cursor:pointer;">Print Receipt</button>
                                                <button onclick="closeReceiptModalCustomer()" style="padding:8px 12px; border-radius:8px; background:transparent; border:1px solid #ccc; cursor:pointer;">Close</button>
                                        </div>
                                </div>
                                <div id="receiptContentCustomer">${receiptHtml}</div>
                        </div>
                </div>`;

        const existing = document.getElementById('receiptModalCustomer'); if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
}

function closeReceiptModalCustomer(){ const m = document.getElementById('receiptModalCustomer'); if (m) m.remove(); }

function downloadReceiptPdfCustomer(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) { showAlert('error','Order not found'); return; }
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${order.id}</title></head><body>${renderReceiptHTML(order)}</body></html>`;
        const w = window.open('', '_blank');
        if (!w) { showAlert('error', 'Popup blocked. Please allow popups to download the PDF.'); return; }
        w.document.open();
        w.document.write(html);
        w.document.close();
        // Give the window a moment to render then trigger print (user can choose Save as PDF)
        setTimeout(()=>{ w.focus(); w.print(); }, 500);
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
        
        showAlert('success', 'Logged out successfully!');
        
        setTimeout(() => {
            window.location.href = getCorrectPath('index.html');
        }, 1000);
    }
}

// ============================================
// CART FUNCTIONALITY
// ============================================

// Cart storage helpers - use per-user cart key so carts don't leak between users
function getCartKey() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    return currentUser ? `cart_${currentUser.email}` : 'cart';
}

function getCart() {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
}

function setCart(cart) {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

function initializeCart() {
    // Ensure the current user's cart exists
    const key = getCartKey();
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
    }
}

function addToCart(item) {
    let cart = getCart();

    // Create a shallow copy so we don't mutate the original menu object
    const cartItem = Object.assign({}, item);

    // Ensure category is captured on the cart item. If the item doesn't carry
    // a category, try to resolve it from admin-managed `menuItems` by id or name.
    if (!cartItem.category) {
        try {
            const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
            const match = menuItems.find(mi => (mi.id && cartItem.id && mi.id === cartItem.id) || (mi.name && cartItem.name && mi.name.toLowerCase() === cartItem.name.toLowerCase()));
            if (match && match.category) {
                cartItem.category = match.category;
            }
        } catch (e) {
            // ignore and continue without category
            console.warn('addToCart: failed to resolve category', e);
        }
    }

    // Check if item already exists in cart: prefer id match, fallback to name
    const existingItem = cart.find(ci => (cartItem.id && ci.id && ci.id === cartItem.id) || (ci.name && cartItem.name && ci.name === cartItem.name));

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cartItem.quantity = 1;
        cart.push(cartItem);
    }

    setCart(cart);
    updateCartBadge();
}

function updateCartBadge() {
    // If no user is logged in, do not read or display cart count
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        // Remove any existing badge and return
        const cartIcon = document.querySelector('.icons ion-icon[name="cart-outline"]');
        if (cartIcon) {
            const existingBadge = cartIcon.parentElement.querySelector('.cart-badge');
            if (existingBadge) existingBadge.remove();
        }
        return;
    }

    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartIcon = document.querySelector('.icons ion-icon[name="cart-outline"]');
    if (cartIcon) {
        // Remove existing badge
        const existingBadge = cartIcon.parentElement.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge if there are items
        if (totalItems > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems;
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f8af1e;
                color: #000;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 700;
            `;
            cartIcon.parentElement.style.position = 'relative';
            cartIcon.parentElement.appendChild(badge);
        }
    }
}

function viewCart() {
    const cart = getCart();
    
    let cartHTML = `
        <div style="
            color: white; 
            padding: 40px 30px; 
            max-width: 700px; 
            width: 90%;
            margin: 20px auto;
            background: rgba(11, 15, 19, 0.98);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        ">
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f8af1e;
            ">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="cart-outline" style="font-size: 2rem;"></ion-icon>
                    Your Cart
                </h2>
                <button onclick="closeCart()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
    `;
    
    if (cart.length === 0) {
        cartHTML += `
            <div style="
                text-align: center;
                padding: 60px 20px;
            ">
                <ion-icon name="cart-outline" style="
                    font-size: 5rem;
                    color: rgba(248, 175, 30, 0.3);
                    margin-bottom: 20px;
                "></ion-icon>
                <h3 style="
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                ">
                    Your cart is empty
                </h3>
                <p style="
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 30px;
                    font-size: 1rem;
                ">
                    Add some delicious dimsum to get started!
                </p>
                <button onclick="closeCart()" style="
                    background: #f8af1e; 
                    color: #000; 
                    border: none; 
                    padding: 15px 30px; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    cursor: pointer;
                    font-size: 1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    <ion-icon name="restaurant-outline" style="font-size: 1.2rem;"></ion-icon>
                    Browse Menu
                </button>
            </div>
        `;
    } else {
        cartHTML += `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 25px;">`;
        
        let total = 0;
        cart.forEach((item, index) => {
    const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
        const itemTotal = price * item.quantity;
        total += itemTotal;
        
            cartHTML += `
                <div style="
                    background: rgba(255, 255, 255, 0.05); 
                    padding: 20px; 
                    margin-bottom: 15px; 
                    border-radius: 12px; 
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <div style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;
                        gap: 20px;
                    ">
                        <div style="flex: 1;">
                            <h3 style="
                                margin: 0 0 10px 0; 
                                font-size: 1.1rem;
                                color: white;
                                font-weight: 600;
                            ">
                                ${item.name}
                            </h3>
                            <div style="
                                display: flex;
                                gap: 12px;
                                align-items: center;
                                flex-wrap: wrap;
                            ">
                                <span style="
                                    color: #f8af1e;
                                    font-size: 0.95rem;
                                    font-weight: 500;
                                ">
                                    ${item.price}
                                </span>
                                <span style="
                                    color: rgba(255, 255, 255, 0.6);
                                    font-size: 0.9rem;
                                ">
                                    |
                                </span>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    background: rgba(255, 255, 255, 0.05);
                                    padding: 6px 10px;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255, 255, 255, 0.1);
                                ">
                                    <button onclick="updateQuantity(${index}, -1)" style="
                                        background: rgba(248, 175, 30, 0.2);
                                        color: #f8af1e;
                                        border: none;
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1.2rem;
                                        font-weight: 700;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='rgba(248,175,30,0.4)'" onmouseout="this.style.background='rgba(248,175,30,0.2)'">
                                        −
                                    </button>
                                    <span style="
                                        color: white;
                                        font-weight: 600;
                                        font-size: 1rem;
                                        min-width: 24px;
                                        text-align: center;
                                    ">
                                        ${item.quantity}
                                    </span>
                                    <button onclick="updateQuantity(${index}, 1)" style="
                                        background: rgba(248, 175, 30, 0.2);
                                        color: #f8af1e;
                                        border: none;
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1.2rem;
                                        font-weight: 700;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='rgba(248,175,30,0.4)'" onmouseout="this.style.background='rgba(248,175,30,0.2)'">
                                        +
                                    </button>
                                </div>
                                <span style="
                                    color: rgba(255, 255, 255, 0.6);
                                    font-size: 0.9rem;
                                ">
                                    |
                                </span>
                                <span style="
                                    color: #f8af1e;
                                    font-weight: 700;
                                    font-size: 1.1rem;
                                ">
                                    ₱${itemTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${index})" style="
                            background: #ef4444; 
                            color: white; 
                            border: none; 
                            padding: 10px 16px; 
                            border-radius: 8px; 
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                            transition: all 0.3s;
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                            <ion-icon name="trash-outline" style="font-size: 1.1rem;"></ion-icon>
                            Remove
                        </button>
                    </div>
                </div>
            `;
        });
        
        cartHTML += `
                </div>
                
                <div style="
                    margin-top: 25px; 
                    padding: 25px 20px 20px;
                    border-top: 2px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                    ">
                        <h3 style="
                            color: white;
                            margin: 0;
                            font-size: 1.3rem;
                            font-weight: 600;
                        ">
                            Total Amount:
                        </h3>
                        <h3 style="
                            color: #f8af1e;
                            margin: 0;
                            font-size: 1.8rem;
                            font-weight: 700;
                        ">
                            ₱${total.toFixed(2)}
                        </h3>
                    </div>
                    
                    <button onclick="checkout()" style="
                        background: #f8af1e; 
                        color: #000; 
                        border: none; 
                        padding: 15px 24px; 
                        border-radius: 10px; 
                        font-weight: 700; 
                        cursor: pointer; 
                        width: 100%;
                        font-size: 1.1rem;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                        <ion-icon name="card-outline" style="font-size: 1.3rem;"></ion-icon>
                        Proceed to Checkout
                    </button>
                    
                    <button onclick="closeCart()" style="
                        background: rgba(255, 255, 255, 0.1); 
                        color: white; 
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 15px 24px; 
                        border-radius: 10px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        width: 100%;
                        font-size: 1rem;
                        transition: all 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        <ion-icon name="arrow-back-outline" style="font-size: 1.2rem;"></ion-icon>
                        Continue Shopping
                    </button>
                </div>
        `;
    }
    
    cartHTML += `</div>`;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'cartModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = cartHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCart();
        }
    });
    
    document.body.appendChild(modal);
}

function updateQuantity(index, change) {
    let cart = getCart();
    
    if (cart[index]) {
        cart[index].quantity = (cart[index].quantity || 1) + change;
        
        // Remove item if quantity becomes 0 or less
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
    setCart(cart);
        
        // Refresh cart view
        closeCart();
        updateCartBadge();
        if (cart.length > 0) {
            viewCart();
        } else {
            showAlert('success', 'Cart cleared!');
        }
    }
}

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
    
    // Close and reopen cart to refresh
    closeCart();
    updateCartBadge();
    if (cart.length > 0) {
        viewCart();
    } else {
        showAlert('success', 'Cart cleared!');
    }
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
}

function checkout() {
    const cart = getCart();
    let total = 0;
    cart.forEach(item => {
    const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
        total += price * item.quantity;
    });
    
    // Close cart and show shipping address form
    closeCart();
    showShippingAddressForm(total);
}

function showShippingAddressForm(total) {
    // Ensure a user is logged in and use per-user address storage
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        alert('Please log in to select a shipping address.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;
    // Get saved addresses for the current user only
    const savedAddresses = JSON.parse(localStorage.getItem(addressesKey)) || [];
    const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
    
    let formHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="location-outline" style="font-size: 2rem;"></ion-icon>
                    Shipping Address
                </h2>
                <button onclick="closeShippingForm()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div class="address-scroll">
    `;
    
    // Show saved addresses if any
    if (savedAddresses.length > 0) {
        formHTML += `
            <div class="saved-addresses">
                <h3 style="color: white; margin-bottom: 15px; font-size: 1.2rem;">Saved Addresses</h3>
        `;
        
        savedAddresses.forEach((addr, index) => {
            formHTML += `
                <div class="address-card" style="background: rgba(255, 255, 255, 0.05); border: ${addr.isDefault ? '2px solid #f8af1e' : '1px solid rgba(255, 255, 255, 0.08)'}; position: relative;">
                    ${addr.isDefault ? '<span style="position: absolute; top: 10px; right: 10px; background: #f8af1e; color: #000; padding: 4px 10px; border-radius: 5px; font-size: 0.75rem; font-weight: 700;">DEFAULT</span>' : ''}
                    <div style="margin-bottom: 10px;">
                        <strong style="color: white; font-size: 1.1rem;">${addr.name}</strong>
                    </div>
                    <p style="color: rgba(255,255,255,0.7); margin: 5px 0; line-height: 1.6;">
                        ${addr.address}<br>
                        ${addr.city}, ${addr.state} ${addr.zipCode}<br>
                        ${addr.country}<br>
                        Phone: ${addr.phone}
                    </p>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="useThisAddress(${index}, ${total})" style="
                            background: #f8af1e;
                            color: #000;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                            <ion-icon name="checkmark-outline" style="vertical-align: middle;"></ion-icon> Use This
                        </button>
                        <button onclick="editAddress(${index})" style="
                            background: rgba(255,255,255,0.1);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.2);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <ion-icon name="create-outline" style="vertical-align: middle;"></ion-icon> Edit
                        </button>
                        <button onclick="deleteAddress(${index})" style="
                            background: rgba(239, 68, 68, 0.2);
                            color: #ef4444;
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                            <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                        </button>
                    </div>
                </div>
            `;
        });
        
        formHTML += `</div>`;
    }
    
    // Add new address form
    formHTML += `
                <div style="margin-top: 25px;">
                    <button onclick="toggleAddressForm()" id="addNewAddressBtn" style="
                        background: rgba(255,255,255,0.1);
                        color: #f8af1e;
                        border: 1px solid #f8af1e;
                        padding: 12px 20px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        <ion-icon name="add-circle-outline" style="font-size: 1.2rem;"></ion-icon>
                        Add New Address
                    </button>
                    
                    <div id="newAddressForm" style="display: none; margin-top: 20px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 20px;">New Shipping Address</h3>
                        <form id="addressForm" onsubmit="saveNewAddress(event, ${total})">
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Full Name *</label>
                                <input type="text" id="addr_name" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.name || ''}">
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Address *</label>
                                <input type="text" id="addr_address" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.address || ''}">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Municipality *</label>
                                    <input type="text" id="addr_city" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.city || ''}">
                                </div>
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Province *</label>
                                    <input type="text" id="addr_state" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.state || ''}">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Zip Code *</label>
                                    <input type="text" id="addr_zipCode" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.zipCode || ''}">
                                </div>
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Country *</label>
                                    <input type="text" id="addr_country" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.country || ''}">
                                </div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Phone Number *</label>
                                <input type="tel" id="addr_phone" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.phone || ''}">
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="addr_default" style="width: 18px; height: 18px; cursor: pointer; accent-color: #f8af1e;">
                                    <span>Set as default address</span>
                                </label>
                            </div>
                            <button type="submit" style="
                                background: #f8af1e;
                                color: #000;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                width: 100%;
                                font-size: 1rem;
                            " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                                Save and Continue
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'shippingModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = formHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeShippingForm();
        }
    });
    
    document.body.appendChild(modal);
}

function toggleAddressForm() {
    const form = document.getElementById('newAddressForm');
    const btn = document.getElementById('addNewAddressBtn');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.innerHTML = '<ion-icon name="remove-circle-outline" style="font-size: 1.2rem;"></ion-icon> Cancel';
    } else {
        form.style.display = 'none';
        btn.innerHTML = '<ion-icon name="add-circle-outline" style="font-size: 1.2rem;"></ion-icon> Add New Address';
    }
}

function saveNewAddress(event, total) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        alert('Please log in to save an address.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;

    const newAddress = {
        id: Date.now(),
        name: document.getElementById('addr_name').value,
        address: document.getElementById('addr_address').value,
        city: document.getElementById('addr_city').value,
        state: document.getElementById('addr_state').value,
        zipCode: document.getElementById('addr_zipCode').value,
        country: document.getElementById('addr_country').value,
        phone: document.getElementById('addr_phone').value,
        isDefault: document.getElementById('addr_default').checked
    };

    let addresses = JSON.parse(localStorage.getItem(addressesKey)) || [];

    // If this is default, remove default from others (for this user only)
    if (newAddress.isDefault) {
        addresses = addresses.map(addr => ({ ...addr, isDefault: false }));
    }

    addresses.push(newAddress);
    localStorage.setItem(addressesKey, JSON.stringify(addresses));

    // Complete checkout with new address
    completeCheckout(newAddress, total);
}

function useThisAddress(index, total) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        alert('Please log in to select an address.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;
    const addresses = JSON.parse(localStorage.getItem(addressesKey)) || [];
    const selectedAddress = addresses[index];
    if (!selectedAddress) return;
    completeCheckout(selectedAddress, total);
}

function editAddress(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        alert('Please log in to edit an address.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;
    const addresses = JSON.parse(localStorage.getItem(addressesKey)) || [];
    const address = addresses[index];
    
    // Show the form with pre-filled data
    document.getElementById('newAddressForm').style.display = 'block';
    document.getElementById('addNewAddressBtn').innerHTML = '<ion-icon name="remove-circle-outline" style="font-size: 1.2rem;"></ion-icon> Cancel';
    
    document.getElementById('addr_name').value = address.name;
    document.getElementById('addr_address').value = address.address;
    document.getElementById('addr_city').value = address.city;
    document.getElementById('addr_state').value = address.state;
    document.getElementById('addr_zipCode').value = address.zipCode;
    document.getElementById('addr_country').value = address.country;
    document.getElementById('addr_phone').value = address.phone;
    document.getElementById('addr_default').checked = address.isDefault;
    
    // Delete the old address (silent) so saving will re-add the edited one
    deleteAddress(index, true);
}

function deleteAddress(index, silent = false) {
    if (!silent && !confirm('Are you sure you want to delete this address?')) {
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        alert('Please log in to manage addresses.');
        return;
    }

    const addressesKey = `shippingAddresses_${currentUser.email}`;
    let addresses = JSON.parse(localStorage.getItem(addressesKey)) || [];
    addresses.splice(index, 1);
    localStorage.setItem(addressesKey, JSON.stringify(addresses));
    
    if (!silent) {
        // Refresh the form
        closeShippingForm();
    const cart = getCart();
        let total = 0;
        cart.forEach(item => {
            const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
            total += price * item.quantity;
        });
        showShippingAddressForm(total);
    }
}

function completeCheckout(address, total) {
    // Prevent checkout if address is outside Batangas province
    if (!isAddressInBatangas(address)) {
        showAlert('error', 'We only deliver within Batangas province. Please choose an address within Batangas.');
        // Keep the shipping form open so the user can edit/select another address
        return;
    }

    // Close shipping form and show payment options
    closeShippingForm();
    showPaymentOptions(address, total);
}

// Helper: returns true if address appears to be in Batangas province
function isAddressInBatangas(address) {
    if (!address) return false;
    try {
        // Build a searchable string
        let raw = '';
        if (typeof address === 'string') raw = address;
        else if (typeof address === 'object') {
            raw = [address.address, address.city, address.state, address.zipCode, address.country]
                .filter(Boolean)
                .join(' ');
        } else {
            raw = String(address);
        }

        const normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        // Check for the token 'batangas' anywhere in the address
        if (normalized.includes('batangas')) return true;

        // Also accept common forms like 'batangas city' which include 'batangas' anyway
        return false;
    } catch (e) {
        console.warn('isAddressInBatangas error', e);
        return false;
    }
}

// Shipping fee helper (fixed)
function getShippingFee(address = null) {
    // Default shipping fee
    const defaultFee = 30.00;

    // Map of location tokens to fees. Keys are tokens we search for in the
    // normalized address string. We include both full names and common
    // variants where helpful (e.g. 'lipa city' and 'lipa').
    const feeMap = [
        { keys: ['mabini'], fee: 50 },
        { keys: ['tingloy'], fee: 60 },
        { keys: ['bauan'], fee: 55 },
        { keys: ['san pascual'], fee: 65 },
        { keys: ['alitagtag'], fee: 75 },
        { keys: ['taal'], fee: 80 },
        { keys: ['san luis'], fee: 70 },
        { keys: ['santa teresita'], fee: 75 },
        { keys: ['lemery'], fee: 90 },

        { keys: ['cuenca'], fee: 85 },
        { keys: ['lipa city', 'lipa'], fee: 100 },
        { keys: ['san jose'], fee: 95 },
        { keys: ['rosario'], fee: 110 },
        { keys: ['san juan'], fee: 120 },
        { keys: ['ibaan'], fee: 95 },
        { keys: ['padre garcia'], fee: 105 },
        { keys: ['taysan'], fee: 115 },

        { keys: ['tanauan city', 'tanauan'], fee: 130 },
        { keys: ['malvar'], fee: 120 },
        { keys: ['santo tomas city', 'santo tomas'], fee: 140 },
        { keys: ['balete'], fee: 115 },
        { keys: ['mataas na kahoy', 'mataasnakahoy', 'mataasnakahoy'], fee: 120 },
        { keys: ['talisay'], fee: 135 },
        { keys: ['laurel'], fee: 130 },

        { keys: ['batangas city'], fee: 85 },
        { keys: ['calaca'], fee: 100 },
        { keys: ['nasugbu'], fee: 130 },
        { keys: ['lian'], fee: 125 }
    ];

    try {
        if (!address) return defaultFee;

        // Build normalized searchable string from address object
        const rawParts = [address.address, address.city, address.state, address.zipCode, address.country]
            .filter(Boolean)
            .join(' ');

        // Normalize: lowercase, remove punctuation except spaces, collapse spaces
        const normalized = String(rawParts).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

        // Check each mapping; return first matching fee
        for (const entry of feeMap) {
            for (const token of entry.keys) {
                const t = token.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                if (!t) continue;
                if (normalized.includes(t)) {
                    return parseFloat(entry.fee);
                }
            }
        }
    } catch (e) {
        console.warn('getShippingFee error:', e);
    }

    return defaultFee;
}

function showPaymentOptions(address, total) {
    const paymentMethods = [
        { id: 'cod', name: 'Cash on Delivery', icon: 'cash-outline' },
        { id: 'gcash', name: 'GCash', icon: 'wallet-outline' },
        { id: 'maya', name: 'Maya', icon: 'phone-portrait-outline' },
        { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' }
    ];
    
    let paymentHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="card-outline" style="font-size: 2rem;"></ion-icon>
                    Select Payment Method
                </h2>
                <button onclick="closePaymentForm()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding-right: 8px; margin-right: -8px;">
                <div style="margin-bottom: 24px;">
                    <div style="background: rgba(248, 175, 30, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(248, 175, 30, 0.3);">
                            <h3 style="color: #f8af1e; margin: 0 0 10px 0; font-size: 1.3rem;">Order Summary</h3>
                            <p style="color: white; margin: 5px 0; font-size: 1.1rem;">
                                <strong>Subtotal:</strong> <span style="color: #f8af1e; font-size: 1.2rem; font-weight: 700;">₱${total.toFixed(2)}</span>
                            </p>
                            <p style="color: white; margin: 5px 0; font-size: 1.1rem;">
                                <strong>Shipping Fee:</strong> <span style="color: #f8af1e; font-size: 1.2rem; font-weight: 700;">₱${getShippingFee(address).toFixed(2)}</span>
                            </p>
                            <p style="color: white; margin: 8px 0 5px 0; font-size: 1.15rem;">
                                <strong>Total Amount:</strong> <span style="color: #f8af1e; font-size: 1.5rem; font-weight: 700;">₱${(total + getShippingFee(address)).toFixed(2)}</span>
                            </p>
                            <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                                <ion-icon name="location-outline" style="vertical-align: middle;"></ion-icon>
                                Shipping to: ${address.address}, ${address.city}, ${address.state}
                            </p>
                        </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: white; margin-bottom: 16px; font-size: 1.2rem;">Choose Your Payment Method</h3>
                    <div style="display: grid; gap: 12px;">
    `;
    
    paymentMethods.forEach(method => {
        paymentHTML += `
            <div id="payment-${method.id}" class="payment-option" data-method-id="${method.id}" data-method-name="${method.name}"
                 style="
                background: rgba(255, 255, 255, 0.05);
                padding: 18px;
                border-radius: 12px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 15px;
            " 
            onmouseover="if(!this.classList.contains('selected')) {this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(248,175,30,0.5)';}" 
            onmouseout="if(!this.classList.contains('selected')) {this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.1)';}">
                <div style="
                    background: #f8af1e;
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                ">
                    <ion-icon name="${method.icon}" style="font-size: 1.6rem; color: #000;"></ion-icon>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h4 style="color: white; margin: 0 0 4px 0; font-size: 1.1rem;">${method.name}</h4>
                    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 0.82rem;">Pay securely with ${method.name}</p>
                </div>
                <ion-icon name="checkmark-circle" class="payment-check-icon" style="font-size: 1.8rem; color: #f8af1e; display: none; flex-shrink: 0;"></ion-icon>
            </div>
        `;
    });
    
    paymentHTML += `
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button id="confirmPaymentBtn" onclick="confirmPayment(${total}, ${JSON.stringify(address).replace(/"/g, '&quot;')})" 
                    style="
                    background: #f8af1e;
                    color: #000;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1rem;
                    flex: 1;
                    opacity: 0.5;
                    pointer-events: none;
                    transition: all 0.3s ease;
                " disabled>
                    <ion-icon name="checkmark-circle-outline" style="vertical-align: middle; font-size: 1.2rem; margin-right: 6px;"></ion-icon>
                    Confirm Payment
                </button>
                <button onclick="closePaymentForm()" style="
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 14px 24px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    min-width: 100px;
                " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = paymentHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePaymentForm();
        }
    });
    
    document.body.appendChild(modal);
    
    // Add click listeners to payment options after a short delay to ensure DOM is ready
    setTimeout(() => {
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const methodId = this.getAttribute('data-method-id');
                const methodName = this.getAttribute('data-method-name');
                console.log('Selected payment:', methodId, methodName);
                highlightPaymentMethod(methodId, methodName);
            });
        });
    }, 100);
}

let selectedPaymentMethod = null;
let selectedPaymentName = null;

function highlightPaymentMethod(methodId, methodName) {
    console.log('highlightPaymentMethod called with:', methodId, methodName);
    
    // Remove selection from all payment methods
    document.querySelectorAll('[id^="payment-"]').forEach(el => {
        el.classList.remove('selected');
        el.style.background = 'rgba(255, 255, 255, 0.05)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        const checkIcon = el.querySelector('.payment-check-icon');
        if (checkIcon) checkIcon.style.display = 'none';
    });
    
    // Highlight selected payment method
    const selectedElement = document.getElementById(`payment-${methodId}`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
        selectedElement.style.background = 'rgba(248, 175, 30, 0.15)';
        selectedElement.style.borderColor = '#f8af1e';
        const checkIcon = selectedElement.querySelector('.payment-check-icon');
        if (checkIcon) checkIcon.style.display = 'block';
    }
    
    // Store selected method
    selectedPaymentMethod = methodId;
    selectedPaymentName = methodName;
    console.log('Stored payment method:', selectedPaymentMethod, selectedPaymentName);
    
    // Enable confirm button
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.pointerEvents = 'auto';
        confirmBtn.disabled = false;
        confirmBtn.onmouseover = function() { this.style.background = '#e48a0a'; };
        confirmBtn.onmouseout = function() { this.style.background = '#f8af1e'; };
    }
}

function confirmPayment(total, address) {
    console.log('confirmPayment called. selectedPaymentMethod:', selectedPaymentMethod, 'selectedPaymentName:', selectedPaymentName);
    
    if (!selectedPaymentMethod || !selectedPaymentName) {
        showAlert('error', 'Please select a payment method first.');
        return;
    }
    
    // Capture selected payment before closing the modal (closePaymentForm resets the globals)
    const paymentMethodIdToSave = selectedPaymentMethod;
    const paymentMethodNameToSave = selectedPaymentName;

    // Process payment
    closePaymentForm();

    // Capture cart items before clearing so we can persist them on the order
    const cartItems = getCart();
    // Ensure each cart item carries canonicalized category and numeric price/quantity
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const canonicalizeCategory = (raw) => {
        if (!raw) return 'Uncategorized';
        const r = String(raw).toLowerCase();
        if (r.includes('steam')) return 'Steamed Dishes';
        if (r.includes('fried')) return 'Fried Dishes';
        if (r.includes('bake')) return 'Baked Dishes';
        if (r.includes('noodle')) return 'Noodles';
        if (r.includes('special')) return 'Special Dishes';
        if (r.includes('dessert')) return 'Dessert';
        return 'Uncategorized';
    };

    const enrichedItems = (cartItems || []).map(it => {
        // Try to find menu metadata by id or name
        const menuMatch = menuItems.find(m => (m.id && it.id && m.id === it.id) || (m.name && it.name && m.name.toLowerCase() === it.name.toLowerCase()));
        const price = Number(it.price || (menuMatch && menuMatch.price) || 0) || 0;
        const qty = Number(it.quantity) || 1;
        const rawCat = it.category || (menuMatch && menuMatch.category) || '';
        const category = canonicalizeCategory(rawCat);
        return {
            id: it.id || (menuMatch && menuMatch.id) || null,
            name: it.name || (menuMatch && menuMatch.name) || 'Item',
            price: price,
            quantity: qty,
            image: it.image || (menuMatch && menuMatch.image) || '',
            category: category
        };
    });

    // Save order to localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const shippingFee = getShippingFee(address);
    const finalTotal = parseFloat((total + shippingFee).toFixed(2));

    // Attach current user info so orders are scoped per-user
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        // store total including shipping so all views reflect amount charged
        total: finalTotal,
        subtotal: parseFloat(total.toFixed(2)),
        shippingFee: shippingFee,
        address: address,
        // Save both ID and display name for robustness
        paymentMethodId: paymentMethodIdToSave,
        paymentMethodName: paymentMethodNameToSave,
        // Keep legacy field for backward compatibility in any other views
        paymentMethod: paymentMethodNameToSave,
        status: 'Processing',
        // Link the order to the user who placed it
        customerEmail: currentUser ? currentUser.email : null,
        customerName: currentUser ? currentUser.name : null,
        // Persist the ordered items so admin/staff can review them
        items: enrichedItems
    };

    // Persist locally first (authoritative local copy)
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Best-effort: push order to Firebase Realtime Database and store returned push-key on local order for reconciliation
    try {
        if (window.firebaseDB && typeof window.firebaseDB.saveOrderRealtime === 'function') {
            window.firebaseDB.saveOrderRealtime(order)
                .then(pushKey => {
                    if (!pushKey) return;
                    try {
                        const stored = JSON.parse(localStorage.getItem('orders')) || [];
                        const idx = stored.findIndex(o => o.id === order.id);
                        if (idx !== -1) {
                            stored[idx].firebaseKey = pushKey;
                            localStorage.setItem('orders', JSON.stringify(stored));
                        }
                    } catch (e) {
                        console.warn('Failed to attach firebase key to local order', e);
                    }
                })
                .catch(err => console.warn('Firebase saveOrderRealtime failed', err));
        }
    } catch (e) {
        console.warn('Firebase order push skipped (not available)', e);
    }

    // Clear cart after saving the order (per-user)
    setCart([]);
    updateCartBadge();
    
    // Use resolved friendly name to avoid 'via null' or raw ids
    const displayPayment = resolvePaymentLabel({ paymentMethodName: paymentMethodNameToSave, paymentMethod: paymentMethodNameToSave, paymentMethodId: paymentMethodIdToSave }) || paymentMethodNameToSave || 'selected payment method';
    showAlert('success', `Payment successful via ${displayPayment}! Subtotal: ₱${total.toFixed(2)}, Shipping: ₱${shippingFee.toFixed(2)}, Total: ₱${finalTotal.toFixed(2)} - Order is being processed.`);
    
    // Reset selected payment
    selectedPaymentMethod = null;
    selectedPaymentName = null;
}

function closePaymentForm() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
    // Reset selected payment
    selectedPaymentMethod = null;
    selectedPaymentName = null;
}

function closeShippingForm() {
    const modal = document.getElementById('shippingModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// SUBSCRIBE FORM
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            // Store subscription
            let subscribers = JSON.parse(localStorage.getItem('subscribers')) || [];
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('subscribers', JSON.stringify(subscribers));
                showAlert('success', 'Successfully subscribed to our newsletter!');
                emailInput.value = '';
            } else {
                showAlert('error', 'This email is already subscribed!');
            }
        });
    }
});

// ============================================
// ALERT MESSAGES
// ============================================

// Show alert messages
function showAlert(type, message) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-message');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message alert-${type}`;
    
    const icon = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';
    alertDiv.innerHTML = `
        <ion-icon name="${icon}"></ion-icon>
        <span>${message}</span>
    `;
    
    // Always show centered at top
    document.body.insertAdjacentElement('afterbegin', alertDiv);
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.zIndex = '10001';
    alertDiv.style.minWidth = '320px';
    alertDiv.style.maxWidth = '90%';
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ============================================
// MENU AVAILABILITY SYNC (Customer UI reflects Admin toggles)
// ============================================

function isMenuItemAvailableByName(name) {
    try {
        const items = JSON.parse(localStorage.getItem('menuItems')) || [];
        const found = items.find(i => (i.name || '').toLowerCase() === (name || '').toLowerCase());
        return found ? !!found.available : true; // default to true if not found
    } catch {
        return true;
    }
}

function applyAvailabilityUI() {
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        const nameEl = card.querySelector('h3');
        const btn = card.querySelector('.add-btn');
        if (!nameEl || !btn) return;

        const name = nameEl.textContent.trim();
        const available = isMenuItemAvailableByName(name);

        if (!available) {
            // Disable add to cart button and indicate unavailable
            btn.disabled = true;
            btn.textContent = 'Unavailable';
            btn.style.background = 'rgba(239, 68, 68, 0.7)';
            btn.style.cursor = 'not-allowed';
            // Dim the card slightly for visual feedback
            card.style.opacity = '0.85';
        } else {
            // Restore default button if previously disabled
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
            btn.style.background = '';
            btn.style.cursor = '';
            card.style.opacity = '';
        }
    });
}

// Re-apply availability on load and when storage changes (e.g., admin toggles availability)
document.addEventListener('DOMContentLoaded', function() {
    applyAvailabilityUI();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'menuItems') {
        applyAvailabilityUI();
    }
});

// ============================================
// REVIEW CAROUSEL FUNCTIONALITY
// ============================================

// Review Buttons Functionality
document.addEventListener('DOMContentLoaded', function() {
    const reviewCards = document.querySelectorAll('.review-card');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const nextBtns = document.querySelectorAll('.next-btn');
    const firstPrevBtn = document.getElementById('prevBtn');
    const firstNextBtn = document.getElementById('nextBtn');
    let currentReview = 0;

    function showReview(index) {
        reviewCards.forEach((card, i) => {
            card.classList.remove('active');
            if (i === index) {
                card.classList.add('active');
            }
        });
    }

    // Next buttons
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        });
    });

    if (firstNextBtn) {
        firstNextBtn.addEventListener('click', () => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        });
    }

    // Previous buttons
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
            showReview(currentReview);
        });
    });

    if (firstPrevBtn) {
        firstPrevBtn.addEventListener('click', () => {
            currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
            showReview(currentReview);
        });
    }

    // Auto-advance reviews every 5 seconds
    if (reviewCards.length > 0) {
        setInterval(() => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        }, 5000);
    }

    // Keyboard navigation for reviews
    document.addEventListener('keydown', (e) => {
        if (reviewCards.length > 0) {
            if (e.key === 'ArrowLeft') {
                currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
                showReview(currentReview);
            } else if (e.key === 'ArrowRight') {
                currentReview = (currentReview + 1) % reviewCards.length;
                showReview(currentReview);
            }
        }
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Add fade-in animation on scroll
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards, menu cards, and review sections
    const animatedElements = document.querySelectorAll('.service-card, .menu-card, .review-container, .subscribe-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ============================================
// BACK TO TOP BUTTON
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<ion-icon name="arrow-up-outline"></ion-icon>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #f8af1e;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(248, 175, 30, 0.4);
    `;
    
    backToTopBtn.querySelector('ion-icon').style.cssText = `
        font-size: 1.5rem;
        color: #000;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide back to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effect
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'scale(1.1)';
        backToTopBtn.style.background = '#e48a0a';
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'scale(1)';
        backToTopBtn.style.background = '#f8af1e';
    });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

let lastScroll = 0;
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.background = 'rgba(11, 15, 19, 0.95)';
        nav.style.boxShadow = '0 8px 30px rgba(0,0,0,0.8)';
    } else {
        nav.style.background = 'var(--card-bg)';
        nav.style.boxShadow = 'var(--glass-shadow)';
    }
    
    lastScroll = currentScroll;
});

// Backfill/migrate existing orders in localStorage to include paymentMethodId/paymentMethodName
function normalizeExistingOrders() {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (!orders.length) return;

    let changed = false;
    // Use the robust resolver to fill missing fields where possible
    orders = orders.map(o => {
        const updated = { ...o };
        try {
            const resolved = resolvePaymentLabel(updated);
            if (resolved && resolved !== 'Unknown') {
                // If a friendly name can be resolved, ensure both name and legacy field exist
                if (updated.paymentMethodName !== resolved) {
                    updated.paymentMethodName = resolved;
                    changed = true;
                }
                if (!updated.paymentMethod || updated.paymentMethod !== resolved) {
                    updated.paymentMethod = resolved;
                    changed = true;
                }
                // Map friendly name back to canonical id
                const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal', 'Cash on Delivery': 'cod' };
                const id = nameToId[resolved] || (typeof updated.paymentMethodId === 'string' ? updated.paymentMethodId : null);
                if (id && updated.paymentMethodId !== id) {
                    updated.paymentMethodId = id;
                    changed = true;
                }
            } else {
                // Try additional heuristics: if paymentMethodId is an object, extract id/name
                if (updated.paymentMethodId && typeof updated.paymentMethodId === 'object') {
                    const maybeId = updated.paymentMethodId.id || updated.paymentMethodId.name;
                    if (maybeId) {
                        const fix = resolvePaymentLabel({ paymentMethodId: maybeId, paymentMethodName: updated.paymentMethodName, paymentMethod: updated.paymentMethod });
                        if (fix && fix !== 'Unknown') {
                            updated.paymentMethodName = fix;
                            updated.paymentMethod = fix;
                            const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal', 'Cash on Delivery': 'cod' };
                            updated.paymentMethodId = nameToId[fix] || String(maybeId);
                            changed = true;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('normalizeExistingOrders: error while normalizing order', updated.id, e);
        }
        return updated;
    });

    if (changed) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

// Resolve payment method label robustly for display (customer-side helper)
function resolvePaymentLabel(order) {
    // Always try to infer one of the canonical names: 'GCash', 'Maya', 'PayPal'.
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

    const direct = (asString(order.paymentMethodName) || asString(order.paymentMethod) || asString(order.paymentMethodId) || '').trim().toLowerCase();
    if (direct === 'gcash') return 'GCash';
    if (direct === 'maya' || direct === 'paymaya') return 'Maya';
    if (direct === 'paypal') return 'PayPal';

    return 'Unknown';
}

// Confirm received: move order from 'orders' into 'purchaseHistory'
function confirmReceived(orderId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to confirm received orders.');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        showAlert('error', 'Order not found.');
        return;
    }

    const order = orders[orderIndex];
    // Ensure the current user owns this order
    if (order.customerEmail && order.customerEmail !== currentUser.email) {
        showAlert('error', 'You are not authorized to confirm this order.');
        return;
    }

    // Mark order as confirmed by customer (keep it in orders for admin/staff view)
    order.confirmedReceived = true;
    order.confirmedDate = new Date().toISOString();

    // prepare purchase entry
    const purchaseEntry = {
        id: order.id,
        date: order.confirmedDate,
        originalOrderDate: order.date,
        total: order.total,
        items: order.items || order.cart || [],
        paymentMethodId: order.paymentMethodId || order.paymentMethod || null,
        paymentMethodName: order.paymentMethodName || order.paymentMethod || null,
        address: order.address || null
    };

    // include customer info on purchase history and save
    purchaseEntry.customerEmail = order.customerEmail || null;
    purchaseEntry.customerName = order.customerName || null;

    const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    history.push(purchaseEntry);
    localStorage.setItem('purchaseHistory', JSON.stringify(history));

    // persist updated orders
    localStorage.setItem('orders', JSON.stringify(orders));

    showAlert('success', 'We’re grateful you chose to order from us!');

    // refresh modal UI: close and re-open to reflect changes
    closeOrderStatusModal();
    setTimeout(() => showOrderStatus(), 300);

    // Best-effort: update remote order record to include confirmedReceived flag so admin/staff panels can reconcile
    try {
        if (window.firebaseDB) {
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
    } catch (e) {
        console.warn('Firebase confirmReceived sync skipped', e);
    }
}

// Customer: cancel an order if it's still Processing or Shipping
function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to cancel orders.');
        return;
    }

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        showAlert('error', 'Order not found.');
        return;
    }

    const order = orders[idx];
    // Ensure only the owner can cancel their order
    if (order.customerEmail && order.customerEmail !== currentUser.email) {
        showAlert('error', 'You are not authorized to cancel this order.');
        return;
    }

    // Only allow cancellation when the order is still in 'Processing' (preparing) state
    if (!(order.status === 'Processing')) {
        showAlert('error', 'This order cannot be cancelled.');
        return;
    }

    // Mark as cancelled and record timestamp
    order.status = 'Cancelled';
    order.cancelledByCustomer = true;
    order.cancelledDate = new Date().toISOString();

    // Note: do NOT save cancelled orders to purchaseHistory. Keep the cancelled status in `orders` only.

    // Persist updated orders
    localStorage.setItem('orders', JSON.stringify(orders));

    // Best-effort: update remote order status to Cancelled in Firebase when possible
    try {
        if (window.firebaseDB) {
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
    } catch (e) {
        console.warn('Firebase cancel sync skipped', e);
    }

    // Recompute analytics if the admin analytics view is open in another window/tab
    try { if (typeof loadAnalytics === 'function') loadAnalytics(); } catch (e) { /* ignore if not present */ }

    showAlert('success', 'Your order has been cancelled. A refund (if any) will be processed by our team.');

    // Refresh order status modal
    closeOrderStatusModal();
    setTimeout(() => showOrderStatus(), 300);
}

// Show Purchase History modal for customers
function showPurchaseHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to view purchase history.');
        return;
    }

    const historyAll = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    // Only show entries that belong to the current user
    const history = historyAll.filter(h => h.customerEmail === currentUser.email);

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="color: #f8af1e; margin: 0; font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    <ion-icon name="bag-check-outline" style="font-size: 2rem;"></ion-icon>
                    Purchase History
                </h2>
                <button onclick="closePurchaseHistoryModal()" style="background: transparent; border: none; color: #f8af1e; font-size: 2rem; cursor: pointer; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"><ion-icon name="close-outline"></ion-icon></button>
            </div>
    `;

    if (history.length === 0) {
        html += `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="bag-check-outline" style="font-size: 5rem; color: rgba(248, 175, 30, 0.3); margin-bottom: 20px;"></ion-icon>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 10px;">No Purchase History</h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-bottom: 30px; font-size: 1rem;">You haven't confirmed any received orders yet.</p>
                <button onclick="closePurchaseHistoryModal()" style="background: #f8af1e; color: #000; border: none; padding: 15px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;" onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">Browse Menu</button>
            </div>
        `;
    } else {
        html += `<div style="flex:1; overflow-y:auto; padding-right:8px;">`;
        history.slice().reverse().forEach(entry => {
            const d = new Date(entry.date);
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <p style="color: rgba(255,255,255,0.6); margin:0; font-size:0.85rem;">Order #${entry.id}</p>
                            <p style="color:white; margin:0; font-size:1.05rem; font-weight:600;">₱${(entry.total||0).toFixed(2)}</p>
                        </div>
                        <p style="color: rgba(255,255,255,0.7); margin:0; font-size:0.85rem;">${d.toLocaleDateString()}</p>
                    </div>
                    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                        ${(entry.items||[]).map(it=>`<div style="display:flex; justify-content:space-between; font-size:0.95rem; color:rgba(255,255,255,0.85); margin-bottom:6px;"><span>${it.name}</span><span>x${it.quantity||1}</span></div>`).join('')}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;

    const modal = document.createElement('div');
    modal.id = 'purchaseHistoryModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e){ if (e.target === modal) closePurchaseHistoryModal(); });
    document.body.appendChild(modal);
}

function closePurchaseHistoryModal() { const m = document.getElementById('purchaseHistoryModal'); if (m) m.remove(); }

// Show Cancelled Orders (reads cancelled orders from `orders` only)
function showCancelledOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to view cancelled orders.');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    const entries = orders
        .filter(o => o.status === 'Cancelled' && o.customerEmail === currentUser.email)
        .map(o => ({
            id: o.id,
            date: o.cancelledDate || new Date().toISOString(),
            originalOrderDate: o.date,
            total: o.total,
            items: o.items || o.cart || [],
            status: 'Cancelled',
            cancelledByCustomer: !!o.cancelledByCustomer,
            cancelledByStaff: !!o.cancelledByStaff,
            cancelledBy: o.cancelledBy || null,
            address: o.address || null,
            paymentMethodId: o.paymentMethodId || o.paymentMethod || null,
            paymentMethodName: o.paymentMethodName || o.paymentMethod || null
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="color: #f8af1e; margin: 0; font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    <ion-icon name="close-circle-outline" style="font-size: 2rem;"></ion-icon>
                    Cancelled Orders
                </h2>
                <button onclick="closeCancelledOrdersModal()" style="background: transparent; border: none; color: #f8af1e; font-size: 2rem; cursor: pointer; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"><ion-icon name="close-outline"></ion-icon></button>
            </div>
    `;

    if (entries.length === 0) {
        html += `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="close-circle-outline" style="font-size: 5rem; color: rgba(239, 68, 68, 0.25); margin-bottom: 20px;"></ion-icon>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 10px;">No Cancelled Orders</h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-bottom: 30px; font-size: 1rem;">You have no cancelled orders yet.</p>
                <button onclick="closeCancelledOrdersModal()" style="background: #f8af1e; color: #000; border: none; padding: 15px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;" onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">Close</button>
            </div>
        `;
    } else {
        html += `<div style="flex:1; overflow-y:auto; padding-right:8px;">`;
        entries.forEach(entry => {
            const d = new Date(entry.date);
            const total = (entry.total || 0).toFixed(2);
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <p style="color: rgba(255,255,255,0.6); margin:0; font-size:0.85rem;">Order #${entry.id}</p>
                            <p style="color:white; margin:0; font-size:1.05rem; font-weight:600;">₱${total}</p>
                        </div>
                        <p style="color: rgba(255,255,255,0.7); margin:0; font-size:0.85rem;">${d.toLocaleDateString()}</p>
                    </div>
                    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                        <div style="flex:1;">${(entry.items||[]).slice(0,3).map(it=>`<div style=\"font-size:0.95rem; color:rgba(255,255,255,0.85);\">${it.name} <small style=\"color:rgba(255,255,255,0.6);\">x${it.quantity||1}</small></div>`).join('')} ${ (entry.items||[]).length > 3 ? `<div style=\"color:rgba(255,255,255,0.6); font-size:0.85rem; margin-top:6px;\">+${(entry.items||[]).length - 3} more</div>` : '' }</div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;

    const modal = document.createElement('div');
    modal.id = 'cancelledOrdersModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e){ if (e.target === modal) closeCancelledOrdersModal(); });
    document.body.appendChild(modal);
}

function closeCancelledOrdersModal() { const m = document.getElementById('cancelledOrdersModal'); if (m) m.remove(); }

// Show items for a cancelled entry stored in purchaseHistory (when order object no longer exists)
function showOrderItemsFromHistory(orderId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) {
        showAlert('error', 'Please login to view order details.');
        return;
    }

    const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    const entry = history.find(h => h.id === orderId);
    if (!entry) {
        showAlert('error', 'Cancelled order details not found.');
        return;
    }
    // Ensure the history entry belongs to current user
    if (entry.customerEmail && entry.customerEmail !== currentUser.email) {
        showAlert('error', 'You are not authorized to view this cancelled order.');
        return;
    }

    const items = entry.items || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #f8af1e;">
                <h2 style="color:#f8af1e; margin:0; font-size:1.5rem; display:flex; align-items:center; gap:10px;"><ion-icon name="cube-outline" style="font-size:1.6rem"></ion-icon> Ordered Items</h2>
                <button onclick="closeOrderItemsModalCustomer()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div style="flex:1; overflow-y:auto;">
    `;

    if (!items || items.length === 0) {
        html += `
            <div style="text-align:center; padding:40px; color: rgba(255,255,255,0.7);">
                <ion-icon name="help-circle-outline" style="font-size:3rem; margin-bottom:10px;"></ion-icon>
                <p>No item details saved for this cancelled order.</p>
            </div>
        `;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
        items.forEach(it => {
            // Resolve price using item fields or fallback to menuItems
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
            <div style="display:flex; gap:10px; margin-top:12px;">
                <button onclick="closeOrderItemsModalCustomer()" style="background:#f8af1e; color:#000; border:none; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">Close</button>
            </div>
        </div>
    `;

    // Reuse the same modal id used by showOrderItemsCustomer so closeOrderItemsModalCustomer() works
    const modal = document.createElement('div');
    modal.id = 'orderItemsModalCustomer';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e){ if (e.target === modal) closeOrderItemsModalCustomer(); });
    document.body.appendChild(modal);
}

// ============================================
// FAQ COLLAPSE/EXPAND
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const faqButtons = document.querySelectorAll('.faq-item .faq-q');
    faqButtons.forEach(btn => {
        // Ensure keyboard accessibility
        btn.setAttribute('role', 'button');
        btn.addEventListener('click', function(e) {
            const item = this.closest('.faq-item');
            const answer = item.querySelector('.faq-a');
            const isOpen = item.classList.toggle('open');

            this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (answer) {
                answer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                // For smooth collapse/expand ensure maxHeight is set (works with CSS max-height transition)
                if (isOpen) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = null;
                }
            }
        });

        // Allow Enter/Space to toggle
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});
