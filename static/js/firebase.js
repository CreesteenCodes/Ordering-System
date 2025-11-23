// This file bootstraps Firebase for the static site using CDN module imports.
// It injects a small module script that initializes the Realtime Database and
// exposes helper methods on 'window.firebaseDB' so existing non-module code
// can call 'window.firebaseDB.saveOrderRealtime(order)' without changing the
// rest of the codebase.

(function() {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    // Create a small module script so we can use the firebase modular SDK from CDN
    const mod = document.createElement('script');
    mod.type = 'module';
    mod.textContent = `
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
        import { getDatabase, ref, push, set, update, remove, get, onValue } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

        const cfg = ${JSON.stringify(firebaseConfig)};
        const app = initializeApp(cfg);
        const db = getDatabase(app);

        // Expose helpers on window.firebaseDB for non-module scripts to use.
        window.firebaseDB = {
            // Save an order object under /orders with a pushed key. Returns the push key.
            saveOrderRealtime: async (order) => {
                const ordersRef = ref(db, 'orders');
                const newRef = push(ordersRef);
                await set(newRef, order);
                return newRef.key;
            },

            // Save a user under /users (push). Returns push key.
            saveUserRealtime: async (user) => {
                const usersRef = ref(db, 'users');
                const newRef = push(usersRef);
                await set(newRef, user);
                return newRef.key;
            },

            // Save or update a menu item (we push an entry carrying the local id so it can be correlated later)
            saveMenuItemRealtime: async (item) => {
                const itemsRef = ref(db, 'menuItems');
                const newRef = push(itemsRef);
                await set(newRef, item);
                return newRef.key;
            },

            // Update an existing menu item by its push-key. If the key does not exist this will create/replace it.
            updateMenuItemRealtime: async (key, item) => {
                if (!key) return null;
                const itemRef = ref(db, 'menuItems/' + key);
                await set(itemRef, item);
                return key;
            },

            // Generic WRITE helper
            // path: string path in the RTDB (e.g. 'orders' or 'menuItems/<key>')
            // data: the object/value to write
            // options: { push: boolean } - if push=true this will push a new child under the path and return the new key
            writeData: async (path, data, options = { push: false }) => {
                if (!path) throw new Error('path is required');
                const targetRef = ref(db, path);
                if (options && options.push) {
                    const newRef = push(targetRef);
                    await set(newRef, data);
                    return { key: newRef.key };
                }
                // set at path (overwrite)
                await set(targetRef, data);
                return { key: null };
            },

            // Generic READ helper
            // path: string path in the RTDB (e.g. 'orders' or 'menuItems/<key>')
            // returns the snapshot value or null
            readData: async (path) => {
                if (!path) throw new Error('path is required');
                const snapshot = await get(ref(db, path));
                if (!snapshot) return null;
                return snapshot.exists() ? snapshot.val() : null;
            },

            // Attach a realtime listener for a path. Returns an unsubscribe function.
            // onChange will be called with (value) whenever data changes.
            listenData: (path, onChange) => {
                if (!path) throw new Error('path is required');
                const r = ref(db, path);
                const off = onValue(r, snapshot => {
                    onChange(snapshot.exists() ? snapshot.val() : null);
                }, err => {
                    console.warn('listenData error', err);
                });
                // Firebase's onValue returns the unsubscribe function when called with onValue(ref, cb)
                // But to be safe, return a function that calls off();
                return () => { try { off(); } catch(e){ /* ignore */ } };
            },

            // Log a deleted menu item (since we may not know the pushed key); admin can reconcile by id
            markMenuItemDeleted: async (localId) => {
                const delRef = ref(db, 'deletedMenuItems');
                const newRef = push(delRef);
                await set(newRef, { id: localId, deletedAt: new Date().toISOString() });
                return newRef.key;
            },

            // Write an array of users to /users. If a user has 'firebaseKey' it will be updated; otherwise a new push will be created.
            // Returns an array of firebase keys in the same order as the input array.
            writeUsers: async (users) => {
                if (!Array.isArray(users)) throw new Error('users must be an array');
                const usersRef = ref(db, 'users');
                const results = [];
                for (const u of users) {
                    if (u && u.firebaseKey) {
                        await set(ref(db, 'users/' + u.firebaseKey), u);
                        results.push(u.firebaseKey);
                    } else {
                        const n = push(usersRef);
                        await set(n, u);
                        results.push(n.key);
                    }
                }
                return results;
            },

            // Read all users from /users and return as an array where each item has a 'firebaseKey' field
            readUsers: async () => {
                const snap = await get(ref(db, 'users'));
                if (!snap || !snap.exists()) return [];
                const obj = snap.val();
                return Object.keys(obj).map(k => ({ ...obj[k], firebaseKey: k }));
            },

            // Write an array of menu items to /menuItems. Will update when firebaseKey exists, otherwise push.
            writeMenuItems: async (items) => {
                if (!Array.isArray(items)) throw new Error('items must be an array');
                const itemsRef = ref(db, 'menuItems');
                const results = [];
                for (const it of items) {
                    if (it && it.firebaseKey) {
                            await set(ref(db, 'menuItems/' + it.firebaseKey), it);
                        results.push(it.firebaseKey);
                    } else {
                        const n = push(itemsRef);
                        await set(n, it);
                        results.push(n.key);
                    }
                }
                return results;
            },

            // Read all menu items and return as array with firebaseKey
            readMenuItems: async () => {
                const snap = await get(ref(db, 'menuItems'));
                if (!snap || !snap.exists()) return [];
                const obj = snap.val();
                return Object.keys(obj).map(k => ({ ...obj[k], firebaseKey: k }));
            },

            // Write orders array to /orders. Updates existing when firebaseKey present, otherwise push.
            writeOrders: async (orders) => {
                if (!Array.isArray(orders)) throw new Error('orders must be an array');
                const ordersRef = ref(db, 'orders');
                const results = [];
                for (const o of orders) {
                    if (o && o.firebaseKey) {
                        await set(ref(db, 'orders/' + o.firebaseKey), o);
                        results.push(o.firebaseKey);
                    } else {
                        const n = push(ordersRef);
                        await set(n, o);
                        results.push(n.key);
                    }
                }
                return results;
            },

            // Read all orders and return array with firebaseKey
            readOrders: async () => {
                const snap = await get(ref(db, 'orders'));
                if (!snap || !snap.exists()) return [];
                const obj = snap.val();
                return Object.keys(obj).map(k => ({ ...obj[k], firebaseKey: k }));
            },

            // Permanently delete an order by push-key (if known) — optional
            deleteOrderByKey: async (key) => {
                if (!key) return;
                await remove(ref(db, 'orders/' + key));
            }
            ,
            // Permanently delete a menu item by its push-key (if known)
            deleteMenuItemByKey: async (key) => {
                if (!key) return;
                await remove(ref(db, 'menuItems/' + key));
            },

            // Permanently delete a user by its push-key (if known)
            deleteUserByKey: async (key) => {
                if (!key) return;
                await remove(ref(db, 'users/' + key));
            }
        };
    `;

    document.head.appendChild(mod);

})();


