/**
 * CompressX Admin Dashboard
 * Complete admin control system with user management, analytics, and settings
 */

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

const AdminAuth = {
    // Default admin credentials (CHANGE THESE!)
    defaultAdmin: {
        email: 'admin@compressx.com',
        password: 'Admin123!', // User should change this immediately
        name: 'Administrator',
        role: 'admin'
    },
    
    // Initialize admin account if doesn't exist
    init() {
        const adminExists = localStorage.getItem('compressXAdmin');
        if (!adminExists) {
            // Hash the default password (simple hash for demo)
            const hashedPassword = this.hashPassword(this.defaultAdmin.password);
            const adminData = {
                ...this.defaultAdmin,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('compressXAdmin', JSON.stringify(adminData));
        }
    },
    
    // Simple password hashing (in production, use proper crypto)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },
    
    // Verify admin login
    verifyAdmin(email, password) {
        const adminData = localStorage.getItem('compressXAdmin');
        if (!adminData) return false;
        
        const admin = JSON.parse(adminData);
        const hashedInput = this.hashPassword(password);
        
        return admin.email === email && admin.password === hashedInput;
    },
    
    // Check if currently logged in as admin
    isAdmin() {
        const currentUser = localStorage.getItem('compressXUser');
        if (!currentUser) return false;
        
        const user = JSON.parse(currentUser);
        return user.role === 'admin';
    },
    
    // Get admin data
    getAdmin() {
        const adminData = localStorage.getItem('compressXAdmin');
        return adminData ? JSON.parse(adminData) : null;
    },
    
    // Update admin password
    updatePassword(oldPassword, newPassword) {
        const admin = this.getAdmin();
        if (!admin) return false;
        
        const hashedOld = this.hashPassword(oldPassword);
        if (admin.password !== hashedOld) return false;
        
        admin.password = this.hashPassword(newPassword);
        localStorage.setItem('compressXAdmin', JSON.stringify(admin));
        return true;
    }
};

// ============================================================================
// USER MANAGEMENT SYSTEM
// ============================================================================

const UserManager = {
    // Get all registered users
    getAllUsers() {
        const users = [];
        const allUsers = localStorage.getItem('compressXUsers');
        
        if (allUsers) {
            return JSON.parse(allUsers);
        }
        
        // Scan localStorage for user accounts
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('compressXStats_')) {
                const email = key.replace('compressXStats_', '');
                const stats = JSON.parse(localStorage.getItem(key));
                users.push({
                    email: email,
                    stats: stats,
                    joinDate: stats.joinDate || 'Unknown'
                });
            }
        }
        
        return users;
    },
    
    // Get user by email
    getUser(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email === email);
    },
    
    // Get user statistics
    getUserStats(email) {
        const statsKey = `compressXStats_${email}`;
        const stats = localStorage.getItem(statsKey);
        return stats ? JSON.parse(stats) : null;
    },
    
    // Delete user account
    deleteUser(email) {
        const statsKey = `compressXStats_${email}`;
        localStorage.removeItem(statsKey);
        
        // Remove from users list if exists
        const allUsers = localStorage.getItem('compressXUsers');
        if (allUsers) {
            const users = JSON.parse(allUsers);
            const filtered = users.filter(u => u.email !== email);
            localStorage.setItem('compressXUsers', JSON.stringify(filtered));
        }
        
        return true;
    },
    
    // Get total user count
    getTotalUsers() {
        return this.getAllUsers().length;
    },
    
    // Search users
    searchUsers(query) {
        const users = this.getAllUsers();
        const lowerQuery = query.toLowerCase();
        return users.filter(u => 
            u.email.toLowerCase().includes(lowerQuery) ||
            (u.name && u.name.toLowerCase().includes(lowerQuery))
        );
    },
    
    // Get recent users
    getRecentUsers(limit = 10) {
        const users = this.getAllUsers();
        return users
            .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
            .slice(0, limit);
    }
};

// ============================================================================
// ANALYTICS SYSTEM
// ============================================================================

const Analytics = {
    // Get global statistics
    getGlobalStats() {
        const users = UserManager.getAllUsers();
        let totalFiles = 0;
        let totalSpaceSaved = 0;
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        users.forEach(user => {
            if (user.stats) {
                totalFiles += user.stats.filesCompressed || 0;
                totalSpaceSaved += user.stats.spaceSaved || 0;
                
                if (user.stats.history) {
                    user.stats.history.forEach(item => {
                        totalOriginalSize += item.originalSize || 0;
                        totalCompressedSize += item.compressedSize || 0;
                    });
                }
            }
        });
        
        const avgCompression = totalOriginalSize > 0 
            ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100)
            : 0;
        
        return {
            totalUsers: users.length,
            totalFiles: totalFiles,
            totalSpaceSaved: totalSpaceSaved,
            avgCompression: avgCompression.toFixed(1),
            totalOriginalSize: totalOriginalSize,
            totalCompressedSize: totalCompressedSize
        };
    },
    
    // Get user activity over time
    getUserActivity() {
        const users = UserManager.getAllUsers();
        const activity = {};
        
        users.forEach(user => {
            if (user.stats && user.stats.history) {
                user.stats.history.forEach(item => {
                    const date = new Date(item.date).toLocaleDateString();
                    activity[date] = (activity[date] || 0) + 1;
                });
            }
        });
        
        return Object.entries(activity)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-30); // Last 30 days
    },
    
    // Get most active users
    getTopUsers(limit = 10) {
        const users = UserManager.getAllUsers();
        return users
            .sort((a, b) => (b.stats?.filesCompressed || 0) - (a.stats?.filesCompressed || 0))
            .slice(0, limit);
    },
    
    // Get compression statistics by day
    getDailyStats() {
        const users = UserManager.getAllUsers();
        const dailyStats = {};
        
        users.forEach(user => {
            if (user.stats && user.stats.history) {
                user.stats.history.forEach(item => {
                    const date = new Date(item.date).toLocaleDateString();
                    if (!dailyStats[date]) {
                        dailyStats[date] = {
                            files: 0,
                            spaceSaved: 0,
                            users: new Set()
                        };
                    }
                    dailyStats[date].files++;
                    dailyStats[date].spaceSaved += (item.originalSize - item.compressedSize) || 0;
                    dailyStats[date].users.add(user.email);
                });
            }
        });
        
        return Object.entries(dailyStats).map(([date, data]) => ({
            date,
            files: data.files,
            spaceSaved: data.spaceSaved,
            activeUsers: data.users.size
        })).slice(-30);
    },
    
    // Get file type distribution
    getFileTypeStats() {
        const users = UserManager.getAllUsers();
        const types = {};
        
        users.forEach(user => {
            if (user.stats && user.stats.history) {
                user.stats.history.forEach(item => {
                    const ext = item.name ? item.name.split('.').pop().toLowerCase() : 'unknown';
                    types[ext] = (types[ext] || 0) + 1;
                });
            }
        });
        
        return types;
    }
};

// ============================================================================
// SETTINGS MANAGER
// ============================================================================

const SettingsManager = {
    defaultSettings: {
        siteName: 'CompressX',
        primaryColor: '#0A4D68',
        accentColor: '#05BFDB',
        maxFileSize: 52428800, // 50MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        requireEmailVerification: false,
        allowSignups: true,
        maintenanceMode: false
    },
    
    // Initialize settings
    init() {
        const settings = localStorage.getItem('compressXSettings');
        if (!settings) {
            localStorage.setItem('compressXSettings', JSON.stringify(this.defaultSettings));
        }
    },
    
    // Get all settings
    getSettings() {
        const settings = localStorage.getItem('compressXSettings');
        return settings ? JSON.parse(settings) : this.defaultSettings;
    },
    
    // Update settings
    updateSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem('compressXSettings', JSON.stringify(updated));
        return updated;
    },
    
    // Reset to defaults
    resetSettings() {
        localStorage.setItem('compressXSettings', JSON.stringify(this.defaultSettings));
        return this.defaultSettings;
    },
    
    // Export all data
    exportData() {
        const data = {
            users: UserManager.getAllUsers(),
            settings: this.getSettings(),
            globalStats: Analytics.getGlobalStats(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }
};

// ============================================================================
// ADMIN UI CONTROLLER
// ============================================================================

const AdminUI = {
    currentView: 'dashboard',
    
    // Render admin dashboard
    renderDashboard() {
        const stats = Analytics.getGlobalStats();
        const recentUsers = UserManager.getRecentUsers(5);
        const topUsers = Analytics.getTopUsers(5);
        
        return `
            <div class="admin-container">
                <div class="admin-header">
                    <h1>🔐 Admin Dashboard</h1>
                    <div class="admin-nav">
                        <button onclick="AdminUI.showView('dashboard')" class="nav-btn active">Dashboard</button>
                        <button onclick="AdminUI.showView('users')" class="nav-btn">Users</button>
                        <button onclick="AdminUI.showView('analytics')" class="nav-btn">Analytics</button>
                        <button onclick="AdminUI.showView('settings')" class="nav-btn">Settings</button>
                        <button onclick="AdminUI.logout()" class="btn-logout">Logout</button>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value">${stats.totalUsers}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🗜️</div>
                        <div class="stat-value">${stats.totalFiles}</div>
                        <div class="stat-label">Files Compressed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💾</div>
                        <div class="stat-value">${this.formatBytes(stats.totalSpaceSaved)}</div>
                        <div class="stat-label">Space Saved</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${stats.avgCompression}%</div>
                        <div class="stat-label">Avg Compression</div>
                    </div>
                </div>
                
                <div class="admin-content-grid">
                    <div class="admin-panel">
                        <h2>Recent Users</h2>
                        <div class="user-list">
                            ${recentUsers.map(user => `
                                <div class="user-item">
                                    <div class="user-info">
                                        <strong>${user.email}</strong>
                                        <small>${new Date(user.joinDate).toLocaleDateString()}</small>
                                    </div>
                                    <button onclick="AdminUI.viewUser('${user.email}')" class="btn-sm">View</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="admin-panel">
                        <h2>Top Users</h2>
                        <div class="user-list">
                            ${topUsers.map(user => `
                                <div class="user-item">
                                    <div class="user-info">
                                        <strong>${user.email}</strong>
                                        <small>${user.stats?.filesCompressed || 0} files</small>
                                    </div>
                                    <span class="badge">${this.formatBytes(user.stats?.spaceSaved || 0)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render users view
    renderUsers() {
        const users = UserManager.getAllUsers();
        
        return `
            <div class="admin-container">
                <div class="admin-header">
                    <h1>👥 User Management</h1>
                    <div class="admin-nav">
                        <button onclick="AdminUI.showView('dashboard')" class="nav-btn">Dashboard</button>
                        <button onclick="AdminUI.showView('users')" class="nav-btn active">Users</button>
                        <button onclick="AdminUI.showView('analytics')" class="nav-btn">Analytics</button>
                        <button onclick="AdminUI.showView('settings')" class="nav-btn">Settings</button>
                        <button onclick="AdminUI.logout()" class="btn-logout">Logout</button>
                    </div>
                </div>
                
                <div class="search-bar">
                    <input type="text" id="userSearch" placeholder="Search users..." 
                           onkeyup="AdminUI.searchUsers(this.value)" class="search-input">
                    <span class="user-count">${users.length} total users</span>
                </div>
                
                <div class="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Files Compressed</th>
                                <th>Space Saved</th>
                                <th>Join Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${users.map(user => `
                                <tr>
                                    <td><strong>${user.email}</strong></td>
                                    <td>${user.stats?.filesCompressed || 0}</td>
                                    <td>${this.formatBytes(user.stats?.spaceSaved || 0)}</td>
                                    <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                                    <td>
                                        <button onclick="AdminUI.viewUserDetails('${user.email}')" class="btn-sm">View</button>
                                        <button onclick="AdminUI.deleteUser('${user.email}')" class="btn-sm btn-danger">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // Render analytics view
    renderAnalytics() {
        const dailyStats = Analytics.getDailyStats();
        const fileTypes = Analytics.getFileTypeStats();
        const activity = Analytics.getUserActivity();
        
        return `
            <div class="admin-container">
                <div class="admin-header">
                    <h1>📈 Analytics</h1>
                    <div class="admin-nav">
                        <button onclick="AdminUI.showView('dashboard')" class="nav-btn">Dashboard</button>
                        <button onclick="AdminUI.showView('users')" class="nav-btn">Users</button>
                        <button onclick="AdminUI.showView('analytics')" class="nav-btn active">Analytics</button>
                        <button onclick="AdminUI.showView('settings')" class="nav-btn">Settings</button>
                        <button onclick="AdminUI.logout()" class="btn-logout">Logout</button>
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="chart-panel">
                        <h3>📊 Daily Activity (Last 30 Days)</h3>
                        <div class="chart-placeholder">
                            ${activity.map(([date, count]) => `
                                <div class="bar-item">
                                    <div class="bar" style="height: ${Math.min(count * 5, 100)}px"></div>
                                    <div class="bar-label">${date.slice(0, 5)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <h3>📁 File Types</h3>
                        <div class="file-types">
                            ${Object.entries(fileTypes).map(([type, count]) => `
                                <div class="file-type-item">
                                    <span class="type-badge">${type.toUpperCase()}</span>
                                    <span class="type-count">${count} files</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <h3>💾 Daily Space Savings</h3>
                        <div class="stats-list">
                            ${dailyStats.slice(-7).map(day => `
                                <div class="stat-row">
                                    <span>${day.date}</span>
                                    <span>${this.formatBytes(day.spaceSaved)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render settings view
    renderSettings() {
        const settings = SettingsManager.getSettings();
        
        return `
            <div class="admin-container">
                <div class="admin-header">
                    <h1>⚙️ Settings</h1>
                    <div class="admin-nav">
                        <button onclick="AdminUI.showView('dashboard')" class="nav-btn">Dashboard</button>
                        <button onclick="AdminUI.showView('users')" class="nav-btn">Users</button>
                        <button onclick="AdminUI.showView('analytics')" class="nav-btn">Analytics</button>
                        <button onclick="AdminUI.showView('settings')" class="nav-btn active">Settings</button>
                        <button onclick="AdminUI.logout()" class="btn-logout">Logout</button>
                    </div>
                </div>
                
                <div class="settings-container">
                    <div class="settings-panel">
                        <h3>🎨 Appearance</h3>
                        <div class="form-group">
                            <label>Site Name</label>
                            <input type="text" id="siteName" value="${settings.siteName}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Primary Color</label>
                            <input type="color" id="primaryColor" value="${settings.primaryColor}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Accent Color</label>
                            <input type="color" id="accentColor" value="${settings.accentColor}" class="form-input">
                        </div>
                    </div>
                    
                    <div class="settings-panel">
                        <h3>🔒 Security</h3>
                        <div class="form-group">
                            <label>Change Admin Password</label>
                            <input type="password" id="oldPassword" placeholder="Current Password" class="form-input">
                            <input type="password" id="newPassword" placeholder="New Password" class="form-input">
                            <button onclick="AdminUI.changePassword()" class="btn-primary">Update Password</button>
                        </div>
                    </div>
                    
                    <div class="settings-panel">
                        <h3>💾 Data Management</h3>
                        <button onclick="AdminUI.exportData()" class="btn-secondary">📥 Export All Data</button>
                        <button onclick="AdminUI.resetSettings()" class="btn-danger">🔄 Reset Settings</button>
                    </div>
                    
                    <div class="settings-actions">
                        <button onclick="AdminUI.saveSettings()" class="btn-primary">Save All Settings</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Helper: Format bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Show specific view
    showView(view) {
        this.currentView = view;
        const container = document.getElementById('app');
        
        switch(view) {
            case 'dashboard':
                container.innerHTML = this.renderDashboard();
                break;
            case 'users':
                container.innerHTML = this.renderUsers();
                break;
            case 'analytics':
                container.innerHTML = this.renderAnalytics();
                break;
            case 'settings':
                container.innerHTML = this.renderSettings();
                break;
        }
    },
    
    // Search users
    searchUsers(query) {
        const users = query ? UserManager.searchUsers(query) : UserManager.getAllUsers();
        const tbody = document.getElementById('usersTableBody');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.email}</strong></td>
                <td>${user.stats?.filesCompressed || 0}</td>
                <td>${this.formatBytes(user.stats?.spaceSaved || 0)}</td>
                <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                <td>
                    <button onclick="AdminUI.viewUserDetails('${user.email}')" class="btn-sm">View</button>
                    <button onclick="AdminUI.deleteUser('${user.email}')" class="btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    },
    
    // View user details
    viewUserDetails(email) {
        const user = UserManager.getUser(email);
        const stats = UserManager.getUserStats(email);
        
        alert(`User Details:\n\nEmail: ${email}\nFiles: ${stats?.filesCompressed || 0}\nSpace Saved: ${this.formatBytes(stats?.spaceSaved || 0)}\nJoined: ${new Date(user.joinDate).toLocaleDateString()}`);
    },
    
    // Delete user
    deleteUser(email) {
        if (confirm(`Are you sure you want to delete user: ${email}?\n\nThis action cannot be undone.`)) {
            UserManager.deleteUser(email);
            this.showView('users');
            alert('User deleted successfully!');
        }
    },
    
    // Save settings
    saveSettings() {
        const siteName = document.getElementById('siteName').value;
        const primaryColor = document.getElementById('primaryColor').value;
        const accentColor = document.getElementById('accentColor').value;
        
        SettingsManager.updateSettings({
            siteName,
            primaryColor,
            accentColor
        });
        
        alert('Settings saved successfully!');
    },
    
    // Change admin password
    changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!oldPassword || !newPassword) {
            alert('Please fill in both password fields');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters');
            return;
        }
        
        if (AdminAuth.updatePassword(oldPassword, newPassword)) {
            alert('Password updated successfully!');
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
        } else {
            alert('Current password is incorrect');
        }
    },
    
    // Export data
    exportData() {
        const data = SettingsManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressx-data-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Reset settings
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            SettingsManager.resetSettings();
            this.showView('settings');
            alert('Settings reset to defaults!');
        }
    },
    
    // Logout
    logout() {
        if (confirm('Logout from admin panel?')) {
            localStorage.removeItem('compressXUser');
            window.location.reload();
        }
    }
};

// Initialize admin system
AdminAuth.init();
SettingsManager.init();
