// Initialize staff accounts (demo accounts)
function initializeStaffAccounts() {
    if (!localStorage.getItem('staffAccounts')) {
        const defaultStaff = [
            {
                id: 1,
                name: 'Staff Member',
                email: 'staff@dimsum.com',
                password: 'dimsum.staff',
                role: 'staff',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Administrator',
                email: 'admin@dimsum.com',
                password: 'dimsum.admin',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('staffAccounts', JSON.stringify(defaultStaff));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeStaffAccounts();
    // Migrate existing default accounts to new passwords if needed
    migrateDefaultStaffPasswords();
});

// Migrate passwords for default seeded accounts if they already exist in storage
function migrateDefaultStaffPasswords() {
    const raw = localStorage.getItem('staffAccounts');
    if (!raw) return;
    let accounts;
    try {
        accounts = JSON.parse(raw) || [];
    } catch (e) {
        return;
    }

    let changed = false;
    accounts = accounts.map(acc => {
        if (acc && acc.email === 'staff@dimsum.com' && acc.role === 'staff' && acc.password !== 'dimsum.staff') {
            changed = true;
            return { ...acc, password: 'dimsum.staff' };
        }
        if (acc && acc.email === 'admin@dimsum.com' && acc.role === 'admin' && acc.password !== 'dimsum.admin') {
            changed = true;
            return { ...acc, password: 'dimsum.admin' };
        }
        return acc;
    });

    if (changed) {
        localStorage.setItem('staffAccounts', JSON.stringify(accounts));
    }
}

// Handle Staff/Admin Login
function handleStaffLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('staffEmail').value;
    const password = document.getElementById('staffPassword').value;
    const role = document.getElementById('staffRole').value;
    const rememberMe = document.getElementById('staffRememberMe').checked;
    
    // Get stored staff accounts
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    
    // Find staff member
    const staff = staffAccounts.find(s => 
        s.email === email && 
        s.password === password && 
        s.role === role
    );
    
    if (staff) {
        // Login successful
        localStorage.setItem('isStaffLoggedIn', 'true');
        localStorage.setItem('currentStaff', JSON.stringify({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role
        }));
        
        if (rememberMe) {
            localStorage.setItem('staffRememberMe', 'true');
        }
        
        showAlert('success', 'Login successful! Redirecting to dashboard...');
        
        setTimeout(() => {
            window.location.href = 'templates/dashboard.html';
        }, 1500);
    } else {
        showAlert('error', 'Invalid credentials or incorrect role selected!');
    }
    
    return false;
}

// Handle Staff/Admin Logout
function handleStaffLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isStaffLoggedIn');
        localStorage.removeItem('currentStaff');
        localStorage.removeItem('staffRememberMe');
        
        showAlert('success', 'Logged out successfully!');
        
        setTimeout(() => {
            window.location.href = '../admin_staff.html';
        }, 1000);
    }
}

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

// Initialize menu items if not present
function initializeMenuItems() {
    const defaultMenuItems = [
            // Steamed Dishes
            { id: 1, name: 'Steamed Sausage Rolls', price: 2.30, category: 'Steamed', image: '../static/images/menu-items/steamed-sausage-rolls.jpg', available: true },
            { id: 2, name: 'Steamed Soup Dumplings', price: 2.80, category: 'Steamed', image: '../static/images/menu-items/steamed-soup-dumplings.jpg', available: true },
            { id: 3, name: 'Shrimp Dumplings', price: 3.00, category: 'Steamed', image: '../static/images/menu-items/shrimp-dumplings.jpg', available: true },
            { id: 4, name: 'Pork Sui Mai', price: 2.70, category: 'Steamed', image: '../static/images/menu-items/pork-sui-mai.jpg', available: true },
            { id: 5, name: 'Steamed Pork Ribs', price: 2.50, category: 'Steamed', image: '../static/images/menu-items/steamed-pork-ribs.jpg', available: true },
            { id: 6, name: 'Steamed Chicken Feet', price: 2.40, category: 'Steamed', image: '../static/images/menu-items/steamed-chicken-feet.jpg', available: true },
            { id: 7, name: 'Sticky Rice in Lotus Leaf', price: 3.10, category: 'Steamed', image: '../static/images/menu-items/sticky-rice-in-lotus-leaf.jpg', available: true },
            { id: 8, name: 'Steamed Pork Buns', price: 2.10, category: 'Steamed', image: '../static/images/menu-items/steamed-pork-buns.jpg', available: true },

            // Fried & Baked Dishes
            { id: 9, name: 'Baked Pork Buns', price: 2.40, category: 'Baked', image: '../static/images/menu-items/baked-pork-buns.jpg', available: true },
            { id: 10, name: 'BBQ Pork Puffs', price: 2.60, category: 'Baked', image: '../static/images/menu-items/bbq-pork-puffs.jpg', available: true },
            { id: 11, name: 'Glutinous Rice Dumplings', price: 2.90, category: 'Fried', image: '../static/images/menu-items/glutinous-rice-dumplings.jpg', available: true },
            { id: 12, name: 'Taro Root Dumplings', price: 2.70, category: 'Fried', image: '../static/images/menu-items/taro-root-dumplings.jpg', available: true },
            { id: 13, name: 'Pan Fried Turnip Cake', price: 2.30, category: 'Fried', image: '../static/images/menu-items/pan-fried-turnip-cake.jpg', available: true },
            { id: 14, name: 'Fried Sticky Rice', price: 3.10, category: 'Fried', image: '../static/images/menu-items/fried-sticky-rice.jpg', available: true },
            { id: 15, name: 'Stuffed Eggplant', price: 2.80, category: 'Fried', image: '../static/images/menu-items/stuffed-eggplant.jpg', available: true },
            { id: 16, name: 'Spring Rolls', price: 2.10, category: 'Fried', image: '../static/images/menu-items/spring-rolls.jpg', available: true },

            // Noodles & Special Dishes
            { id: 17, name: 'Shrimp Noodle Rolls', price: 3.20, category: 'Noodles', image: '../static/images/menu-items/shrimp-noodle-rolls.jpg', available: true },
            { id: 18, name: 'Beef Noodle Rolls', price: 3.30, category: 'Noodles', image: '../static/images/menu-items/beef-noodle-rolls.jpg', available: true },
            { id: 19, name: 'Chinese Donut Noodle Rolls', price: 3.00, category: 'Noodles', image: '../static/images/menu-items/chinese-donut-noodle-rolls.jpg', available: true },
            { id: 20, name: 'Dried Shrimp Scallion Noodle Rolls', price: 3.10, category: 'Noodles', image: '../static/images/menu-items/dried-shrimp-scallion-noodle-rolls.jpg', available: true },
            { id: 21, name: 'Clams in Black Bean Sauce', price: 3.50, category: 'Special', image: '../static/images/menu-items/clams-in-black-bean-sauce.jpg', available: true },
            { id: 22, name: 'Steamed Beef Tripe', price: 2.90, category: 'Special', image: '../static/images/menu-items/steamed-beef-tripe.jpg', available: true },
            { id: 23, name: 'BBQ Pork Noodle Rolls', price: 3.20, category: 'Noodles', image: '../static/images/menu-items/bbq-pork-noodle-rolls.jpg', available: true },
            { id: 24, name: 'Garlic Pea Sprouts', price: 2.70, category: 'Special', image: '../static/images/menu-items/garlic-pea-sprouts.jpg', available: true },

            // Dessert Dishes
            { id: 25, name: 'Deep Fried Egg Puffs', price: 2.10, category: 'Dessert', image: '../static/images/menu-items/deep-fried-egg-puffs.jpg', available: true },
            { id: 26, name: 'Deep Fried Twisted Egg Puffs', price: 2.20, category: 'Dessert', image: '../static/images/menu-items/deep-fried-twisted-egg-puffs.jpg', available: true },
            { id: 27, name: 'Egg Tarts', price: 1.70, category: 'Dessert', image: '../static/images/menu-items/egg-tarts.jpg', available: true },
            { id: 28, name: 'Fried Sesame Balls', price: 2.00, category: 'Dessert', image: '../static/images/menu-items/fried-sesame-balls.jpg', available: true },
            { id: 29, name: 'Steamed Sesame Balls', price: 2.10, category: 'Dessert', image: '../static/images/menu-items/steamed-sesame-balls.jpg', available: true },
            { id: 30, name: 'Sponge Cake', price: 1.80, category: 'Dessert', image: '../static/images/menu-items/sponge-cake.jpg', available: true },
            { id: 31, name: 'Mango Pudding', price: 2.40, category: 'Dessert', image: '../static/images/menu-items/mango-pudding.jpg', available: true },
            { id: 32, name: 'Sweet Tofu', price: 2.30, category: 'Dessert', image: '../static/images/menu-items/sweet-tofu.jpg', available: true }
    ];

    const existingRaw = localStorage.getItem('menuItems');
    if (!existingRaw) {
        // Seed fresh
        localStorage.setItem('menuItems', JSON.stringify(defaultMenuItems));
        return;
    }

    // Merge missing items without duplicating existing ones
    let existing = [];
    try { existing = JSON.parse(existingRaw) || []; } catch { existing = []; }

    const existingNames = new Set(existing.map(i => (i.name || '').toLowerCase()));
    let maxId = existing.reduce((m, i) => Math.max(m, typeof i.id === 'number' ? i.id : 0), 0);
    let changed = false;

    defaultMenuItems.forEach(def => {
        if (!existingNames.has(def.name.toLowerCase())) {
            maxId += 1;
            const itemToAdd = { ...def, id: maxId };
            existing.push(itemToAdd);
            existingNames.add(def.name.toLowerCase());
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem('menuItems', JSON.stringify(existing));
    }
}

// Initialize all data
document.addEventListener('DOMContentLoaded', function() {
    initializeMenuItems();
});
