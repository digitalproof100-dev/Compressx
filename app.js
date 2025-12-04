/**
 * CompressX - Professional File Compression Tool
 * Main Application JavaScript
 * 
 * This application uses vanilla JavaScript with a modular architecture
 * for easy maintenance and scalability.
 */

// ============================================================================
// APPLICATION STATE MANAGEMENT
// ============================================================================

const AppState = {
    user: null,
    stats: {
        filesCompressed: 0,
        spaceSaved: 0,
        avgCompression: 0,
        history: []
    },
    compressedFiles: new Map(),
    
    // Initialize state from localStorage
    init() {
        const savedUser = localStorage.getItem('compressXUser');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.loadStats();
        }
    },
    
    // Load user statistics
    loadStats() {
        if (this.user) {
            const statsKey = `compressXStats_${this.user.email}`;
            const saved = localStorage.getItem(statsKey);
            if (saved) {
                this.stats = JSON.parse(saved);
            }
        }
    },
    
    // Save user statistics
    saveStats() {
        if (this.user) {
            const statsKey = `compressXStats_${this.user.email}`;
            localStorage.setItem(statsKey, JSON.stringify(this.stats));
        }
    }
};

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

const AuthService = {
    // Initialize demo account
    initDemoAccount() {
        const users = this.getUsers();
        if (!users.find(u => u.email === 'demo@compressx.com')) {
            users.push({
                name: 'Demo User',
                email: 'demo@compressx.com',
                password: 'demo123'
            });
            this.saveUsers(users);
        }
    },
    
    // Get all users
    getUsers() {
        return JSON.parse(localStorage.getItem('compressXUsers') || '[]');
    },
    
    // Save users
    saveUsers(users) {
        localStorage.setItem('compressXUsers', JSON.stringify(users));
    },
    
    // Login user
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            AppState.user = { name: user.name, email: user.email };
            localStorage.setItem('compressXUser', JSON.stringify(AppState.user));
            AppState.loadStats();
            return { success: true };
        }
        
        return { success: false, error: 'Invalid email or password' };
    },
    
    // Register new user
    register(name, email, password) {
        const users = this.getUsers();
        
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already registered' };
        }
        
        users.push({ name, email, password });
        this.saveUsers(users);
        
        AppState.user = { name, email };
        localStorage.setItem('compressXUser', JSON.stringify(AppState.user));
        AppState.stats = {
            filesCompressed: 0,
            spaceSaved: 0,
            avgCompression: 0,
            history: []
        };
        AppState.saveStats();
        
        return { success: true };
    },
    
    // Logout user
    logout() {
        AppState.user = null;
        localStorage.removeItem('compressXUser');
    },
    
    // Reset password
    resetPassword(email, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            this.saveUsers(users);
            return { success: true };
        }
        
        return { success: false, error: 'User not found' };
    },
    
    // Change password
    changePassword(email, currentPassword, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }
        
        if (users[userIndex].password !== currentPassword) {
            return { success: false, error: 'Current password is incorrect' };
        }
        
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        return { success: true };
    },
    
    // Delete account
    deleteAccount(email) {
        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.email !== email);
        this.saveUsers(filteredUsers);
        
        // Delete user stats
        const statsKey = `compressXStats_${email}`;
        localStorage.removeItem(statsKey);
        
        this.logout();
        return { success: true };
    }
};

// ============================================================================
// COMPRESSION SERVICE
// ============================================================================

const CompressionService = {
    // Compress image using Canvas API
    compressImage(file, callback) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Compress to JPEG with 70% quality
                canvas.toBlob(function(blob) {
                    callback(blob);
                }, 'image/jpeg', 0.7);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    },
    
    // Simulate PDF compression
    compressPDF(file, callback) {
        // In production, this would use a backend service
        // For demo, we simulate compression
        setTimeout(() => {
            const compressionRatio = 0.4 + Math.random() * 0.3;
            const compressedSize = file.size * compressionRatio;
            const blob = new Blob([new Uint8Array(Math.floor(compressedSize))], {
                type: 'application/pdf'
            });
            callback(blob);
        }, 1500);
    },
    
    // Download compressed file
    download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // For images, change extension to .jpg
        const ext = filename.split('.').pop().toLowerCase();
        let downloadName = filename;
        if (['png', 'gif', 'bmp', 'webp'].includes(ext)) {
            downloadName = filename.replace(/\.[^.]+$/, '.jpg');
        }
        
        a.download = 'compressed_' + downloadName;
        a.click();
        
        URL.revokeObjectURL(url);
    }
};

// ============================================================================
// UI CONTROLLER
// ============================================================================

const UIController = {
    // Render the application
    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.getHTML();
        this.attachEventListeners();
        this.updateUI();
    },
    
    // Get main HTML structure
    getHTML() {
        return `
            <div class="container">
                ${this.getHeaderHTML()}
                ${this.getLandingPageHTML()}
                ${this.getLoginPageHTML()}
                ${this.getSignupPageHTML()}
                ${this.getForgotPasswordPageHTML()}
                ${this.getResetPasswordPageHTML()}
                ${this.getDashboardPageHTML()}
            </div>
        `;
    },
    
    // Header HTML
    getHeaderHTML() {
        return `
            <header>
                <div class="logo" id="logo">CompressX</div>
                <nav>
                    <button id="btnHome">Home</button>
                    <button id="btnLogin">Login</button>
                    <button class="btn btn-primary" id="btnSignup">Get Started</button>
                    <button id="btnDashboard" class="hidden">Dashboard</button>
                    <button id="btnLogout" class="hidden">Logout</button>
                </nav>
            </header>
        `;
    },
    
    // Landing Page HTML
    getLandingPageHTML() {
        return `
            <div id="pageLanding" class="page active">
                <div class="hero">
                    <h1>Compress Smarter,<br>Not Harder</h1>
                    <p class="subtitle">Lightning-fast file compression for images and PDFs. Reduce file sizes by up to 90% without quality loss.</p>
                    <div class="cta-buttons">
                        <button class="btn btn-primary" id="heroSignup">Start Compressing Free</button>
                        <button class="btn btn-outline" id="heroLogin">Sign In</button>
                    </div>
                </div>
                <div class="features">
                    <div class="feature-card">
                        <h3>⚡ Ultra Fast</h3>
                        <p>Advanced algorithms compress your files in seconds, not minutes. Optimized for speed and efficiency.</p>
                    </div>
                    <div class="feature-card">
                        <h3>🎯 Smart Compression</h3>
                        <p>Intelligent quality detection ensures your images look perfect while achieving maximum compression.</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔒 Secure & Private</h3>
                        <p>All files are processed securely and automatically deleted after compression. Your privacy is guaranteed.</p>
                    </div>
                    <div class="feature-card">
                        <h3>📊 Multiple Formats</h3>
                        <p>Support for JPEG, PNG, GIF, and PDF formats. One tool for all your compression needs.</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Login Page HTML
    getLoginPageHTML() {
        return `
            <div id="pageLogin" class="page">
                <div class="auth-container">
                    <h2>Welcome Back</h2>
                    <div class="demo-info">
                        <strong>Demo Account:</strong><br>
                        Email: demo@compressx.com<br>
                        Password: demo123
                    </div>
                    <form id="formLogin">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Sign In</button>
                        <div style="text-align: center; margin-top: 1rem;">
                            <a id="linkForgotPassword" style="color: var(--accent); cursor: pointer; font-size: 0.95rem;">Forgot password?</a>
                        </div>
                    </form>
                    <div class="auth-footer">
                        Don't have an account? <a id="linkToSignup">Sign up</a>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Signup Page HTML
    getSignupPageHTML() {
        return `
            <div id="pageSignup" class="page">
                <div class="auth-container">
                    <h2>Create Account</h2>
                    <form id="formSignup">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="signupName" required>
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="signupEmail" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="signupPassword" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Create Account</button>
                    </form>
                    <div class="auth-footer">
                        Already have an account? <a id="linkToLogin">Sign in</a>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Forgot Password Page HTML
    getForgotPasswordPageHTML() {
        return `
            <div id="pageForgotPassword" class="page">
                <div class="auth-container">
                    <h2>Reset Password</h2>
                    <p style="color: var(--gray); text-align: center; margin-bottom: 2rem;">Enter your email address and we'll help you reset your password.</p>
                    <form id="formForgotPassword">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="forgotEmail" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Reset Password</button>
                    </form>
                    <div class="auth-footer">
                        Remember your password? <a id="linkBackToLogin">Sign in</a>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Reset Password Page HTML
    getResetPasswordPageHTML() {
        return `
            <div id="pageResetPassword" class="page">
                <div class="auth-container">
                    <h2>Set New Password</h2>
                    <p style="color: var(--gray); text-align: center; margin-bottom: 2rem;">Enter your new password below.</p>
                    <form id="formResetPassword">
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" id="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" id="confirmPassword" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Update Password</button>
                    </form>
                </div>
            </div>
        `;
    },
    
    // Dashboard Page HTML
    getDashboardPageHTML() {
        return `
            <div id="pageDashboard" class="page">
                <div class="dashboard-grid">
                    <aside class="sidebar">
                        <ul class="sidebar-menu">
                            <li><button id="navDashboard" class="active">📊 Dashboard</button></li>
                            <li><button id="navCompress">🗜️ Compress Files</button></li>
                            <li><button id="navProfile">👤 Profile</button></li>
                        </ul>
                    </aside>
                    <main class="main-content">
                        ${this.getDashboardSectionHTML()}
                        ${this.getCompressSectionHTML()}
                        ${this.getProfileSectionHTML()}
                    </main>
                </div>
            </div>
        `;
    },
    
    // Dashboard Section HTML
    getDashboardSectionHTML() {
        return `
            <div id="sectionDashboard" class="dashboard-section active">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Dashboard</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Files Compressed</div>
                        <div class="stat-value" id="statFiles">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Space Saved</div>
                        <div class="stat-value" id="statSpace">0 MB</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Avg Compression</div>
                        <div class="stat-value" id="statAvg">0%</div>
                    </div>
                </div>
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Recent Activity</h3>
                <div id="recentActivity">
                    <p style="color: var(--gray); text-align: center; padding: 2rem;">No compression history yet. Start compressing files!</p>
                </div>
            </div>
        `;
    },
    
    // Compress Section HTML
    getCompressSectionHTML() {
        return `
            <div id="sectionCompress" class="dashboard-section">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Compress Files</h2>
                <div class="upload-zone" id="uploadZone">
                    <div class="upload-icon">📁</div>
                    <h3>Drop files here or click to browse</h3>
                    <p>Upload your images or PDFs to compress</p>
                    <div class="supported-formats">
                        <span class="format-badge">.JPEG</span>
                        <span class="format-badge">.PNG</span>
                        <span class="format-badge">.GIF</span>
                        <span class="format-badge">.PDF</span>
                    </div>
                    <input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.gif,.pdf" style="display: none;">
                </div>
                <div id="fileList"></div>
            </div>
        `;
    },
    
    // Profile Section HTML
    getProfileSectionHTML() {
        return `
            <div id="sectionProfile" class="dashboard-section">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Profile</h2>
                <div class="profile-header">
                    <div class="avatar" id="profileAvatar">U</div>
                    <div>
                        <h2 id="profileName" style="font-size: 2rem; margin-bottom: 0.5rem;">User Name</h2>
                        <p id="profileEmail" style="color: var(--gray);">user@example.com</p>
                    </div>
                </div>
                <form id="formProfile">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="profileNameInput" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="profileEmailInput" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
                <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Change Password</h3>
                    <form id="formChangePassword">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" id="currentPassword" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" id="changeNewPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" id="changeConfirmPassword" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary">Change Password</button>
                    </form>
                </div>
                <div class="danger-zone">
                    <h3>Danger Zone</h3>
                    <p>Once you delete your account, there is no going back. This will permanently delete all your data.</p>
                    <button class="btn btn-danger" id="btnDeleteAccount">Delete Account</button>
                </div>
            </div>
        `;
    },
    
    // Attach all event listeners
    attachEventListeners() {
        // Navigation
        this.addListener('logo', 'click', () => this.handleLogoClick());
        this.addListener('btnHome', 'click', () => this.showPage('pageLanding'));
        this.addListener('btnLogin', 'click', () => this.showPage('pageLogin'));
        this.addListener('btnSignup', 'click', () => this.showPage('pageSignup'));
        this.addListener('btnDashboard', 'click', () => {
            this.showPage('pageDashboard');
            this.showDashboardSection('sectionDashboard');
        });
        this.addListener('btnLogout', 'click', () => this.handleLogout());
        
        // Hero buttons
        this.addListener('heroSignup', 'click', () => this.showPage('pageSignup'));
        this.addListener('heroLogin', 'click', () => this.showPage('pageLogin'));
        
        // Auth links
        this.addListener('linkToSignup', 'click', () => this.showPage('pageSignup'));
        this.addListener('linkToLogin', 'click', () => this.showPage('pageLogin'));
        this.addListener('linkForgotPassword', 'click', () => this.showPage('pageForgotPassword'));
        this.addListener('linkBackToLogin', 'click', () => this.showPage('pageLogin'));
        
        // Forms
        this.addListener('formLogin', 'submit', (e) => this.handleLogin(e));
        this.addListener('formSignup', 'submit', (e) => this.handleSignup(e));
        this.addListener('formForgotPassword', 'submit', (e) => this.handleForgotPassword(e));
        this.addListener('formResetPassword', 'submit', (e) => this.handleResetPassword(e));
        this.addListener('formProfile', 'submit', (e) => this.handleProfileUpdate(e));
        this.addListener('formChangePassword', 'submit', (e) => this.handleChangePassword(e));
        
        // Account deletion
        this.addListener('btnDeleteAccount', 'click', () => this.handleDeleteAccount());
        
        // Dashboard navigation
        this.addListener('navDashboard', 'click', () => this.showDashboardSection('sectionDashboard'));
        this.addListener('navCompress', 'click', () => this.showDashboardSection('sectionCompress'));
        this.addListener('navProfile', 'click', () => this.showDashboardSection('sectionProfile'));
        
        // File upload
        this.setupFileUpload();
    },
    
    // Helper to add event listener
    addListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    },
    
    // Setup file upload
    setupFileUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        if (!uploadZone || !fileInput) return;
        
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    },
    
    // Show page
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
        }
    },
    
    // Show dashboard section
    showDashboardSection(sectionId) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
        
        // Update sidebar
        document.querySelectorAll('.sidebar-menu button').forEach(btn => {
            btn.classList.remove('active');
        });
        if (sectionId === 'sectionDashboard') {
            document.getElementById('navDashboard')?.classList.add('active');
        } else if (sectionId === 'sectionCompress') {
            document.getElementById('navCompress')?.classList.add('active');
        } else if (sectionId === 'sectionProfile') {
            document.getElementById('navProfile')?.classList.add('active');
        }
    },
    
    // Handle logo click
    handleLogoClick() {
        if (AppState.user) {
            this.showPage('pageDashboard');
            this.showDashboardSection('sectionDashboard');
        } else {
            this.showPage('pageLanding');
        }
    },
    
    // Handle login
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = AuthService.login(email, password);
        
        if (result.success) {
            this.updateUI();
            this.showPage('pageDashboard');
            this.showDashboardSection('sectionDashboard');
        } else {
            alert(result.error);
        }
    },
    
    // Handle signup
    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        const result = AuthService.register(name, email, password);
        
        if (result.success) {
            this.updateUI();
            this.showPage('pageDashboard');
            this.showDashboardSection('sectionDashboard');
        } else {
            alert(result.error);
        }
    },
    
    // Handle logout
    handleLogout() {
        AuthService.logout();
        this.updateUI();
        this.showPage('pageLanding');
    },
    
    // Handle forgot password
    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        
        const users = AuthService.getUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            alert('No account found with that email address.');
            return;
        }
        
        sessionStorage.setItem('resetEmail', email);
        alert('Password reset confirmed! You can now set a new password.');
        this.showPage('pageResetPassword');
    },
    
    // Handle reset password
    handleResetPassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const email = sessionStorage.getItem('resetEmail');
        
        if (!email) {
            alert('Invalid reset session. Please try forgot password again.');
            this.showPage('pageForgotPassword');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        const result = AuthService.resetPassword(email, newPassword);
        
        if (result.success) {
            sessionStorage.removeItem('resetEmail');
            alert('Password updated successfully! Please login with your new password.');
            this.showPage('pageLogin');
        } else {
            alert(result.error);
        }
    },
    
    // Handle profile update
    handleProfileUpdate(e) {
        e.preventDefault();
        const name = document.getElementById('profileNameInput').value;
        const email = document.getElementById('profileEmailInput').value;
        
        AppState.user = { name, email };
        localStorage.setItem('compressXUser', JSON.stringify(AppState.user));
        
        this.updateProfileDisplay();
        alert('Profile updated successfully!');
    },
    
    // Handle change password
    handleChangePassword(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('changeNewPassword').value;
        const confirmPassword = document.getElementById('changeConfirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        
        const result = AuthService.changePassword(AppState.user.email, currentPassword, newPassword);
        
        if (result.success) {
            document.getElementById('formChangePassword').reset();
            alert('Password changed successfully!');
        } else {
            alert(result.error);
        }
    },
    
    // Handle delete account
    handleDeleteAccount() {
        const confirmation = confirm('⚠️ WARNING ⚠️\n\nAre you sure you want to DELETE your account?\n\nThis will permanently delete:\n• Your profile information\n• All compression history\n• All saved statistics\n\nThis action CANNOT be undone!');
        
        if (!confirmation) return;
        
        const finalConfirmation = prompt('Type DELETE in ALL CAPS to confirm account deletion:');
        
        if (finalConfirmation !== 'DELETE') {
            alert('Account deletion cancelled.');
            return;
        }
        
        const result = AuthService.deleteAccount(AppState.user.email);
        
        if (result.success) {
            alert('Your account has been permanently deleted.');
            this.updateUI();
            this.showPage('pageLanding');
        }
    },
    
    // Handle file upload
    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.id = fileId;
            fileItem.innerHTML = `
                <div class="file-header">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">Original: ${originalSizeMB} MB</span>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="UIController.compressFile('${fileId}')">Compress File</button>
                    <button class="btn btn-outline" onclick="UIController.removeFile('${fileId}')">Remove</button>
                </div>
            `;
            
            document.getElementById('fileList')?.appendChild(fileItem);
            fileItem._file = file;
        });
    },
    
    // Remove file
    removeFile(fileId) {
        const fileItem = document.getElementById(fileId);
        if (fileItem) {
            fileItem.remove();
        }
    },
    
    // Compress file
    compressFile(fileId) {
        const fileItem = document.getElementById(fileId);
        const file = fileItem._file;
        
        fileItem.innerHTML = `
            <div class="file-header">
                <span class="file-name">${file.name}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="compression-stats">
                <span>Compressing...</span>
                <span class="stat-warning">0%</span>
            </div>
        `;
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            const progressFill = fileItem.querySelector('.progress-fill');
            const stats = fileItem.querySelector('.compression-stats');
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (stats) stats.innerHTML = `<span>Compressing...</span><span class="stat-warning">${Math.floor(progress)}%</span>`;
        }, 150);
        
        // Compress file
        if (file.type.startsWith('image/')) {
            CompressionService.compressImage(file, (compressedBlob) => {
                clearInterval(progressInterval);
                this.finishCompression(fileItem, fileId, file.name, file.size, compressedBlob);
            });
        } else {
            CompressionService.compressPDF(file, (compressedBlob) => {
                clearInterval(progressInterval);
                this.finishCompression(fileItem, fileId, file.name, file.size, compressedBlob);
            });
        }
    },
    
    // Finish compression
    finishCompression(fileItem, fileId, filename, originalSize, compressedBlob) {
        const compressedSize = compressedBlob.size;
        const ratio = 1 - (compressedSize / originalSize);
        const savedPercentage = (ratio * 100).toFixed(1);
        const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
        const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
        const savedMB = parseFloat(originalSizeMB) - parseFloat(compressedSizeMB);
        
        // Store compressed blob
        AppState.compressedFiles.set(fileId, { blob: compressedBlob, filename: filename });
        
        fileItem.innerHTML = `
            <div class="file-header">
                <span class="file-name">${filename}</span>
            </div>
            <div class="compression-stats">
                <span>Original: ${originalSizeMB} MB</span>
                <span class="stat-success">Saved: ${savedPercentage}%</span>
                <span>Compressed: ${compressedSizeMB} MB</span>
            </div>
            <div class="action-buttons">
                <button class="btn btn-accent" onclick="UIController.downloadCompressedFile('${fileId}')">Download</button>
                <button class="btn btn-outline" onclick="UIController.removeFile('${fileId}')">Remove</button>
            </div>
        `;
        
        // Update stats
        AppState.stats.filesCompressed++;
        AppState.stats.spaceSaved += savedMB;
        
        const totalCompression = (AppState.stats.avgCompression * (AppState.stats.filesCompressed - 1)) + parseFloat(savedPercentage);
        AppState.stats.avgCompression = totalCompression / AppState.stats.filesCompressed;
        
        AppState.stats.history.push({
            name: filename,
            originalSize: `${originalSizeMB} MB`,
            compressedSize: `${compressedSizeMB} MB`,
            saved: savedPercentage,
            date: new Date().toLocaleDateString()
        });
        
        AppState.saveStats();
        this.updateStatsDisplay();
    },
    
    // Download compressed file
    downloadCompressedFile(fileId) {
        const fileData = AppState.compressedFiles.get(fileId);
        if (!fileData) {
            alert('Compressed file not found!');
            return;
        }
        
        CompressionService.download(fileData.blob, fileData.filename);
    },
    
    // Update UI based on auth state
    updateUI() {
        const isLoggedIn = AppState.user !== null;
        
        // Update navigation
        const btnHome = document.getElementById('btnHome');
        const btnLogin = document.getElementById('btnLogin');
        const btnSignup = document.getElementById('btnSignup');
        const btnDashboard = document.getElementById('btnDashboard');
        const btnLogout = document.getElementById('btnLogout');
        
        if (btnHome) btnHome.classList.toggle('hidden', isLoggedIn);
        if (btnLogin) btnLogin.classList.toggle('hidden', isLoggedIn);
        if (btnSignup) btnSignup.classList.toggle('hidden', isLoggedIn);
        if (btnDashboard) btnDashboard.classList.toggle('hidden', !isLoggedIn);
        if (btnLogout) btnLogout.classList.toggle('hidden', !isLoggedIn);
        
        if (isLoggedIn) {
            this.updateStatsDisplay();
            this.updateProfileDisplay();
        }
    },
    
    // Update stats display
    updateStatsDisplay() {
        const statFiles = document.getElementById('statFiles');
        const statSpace = document.getElementById('statSpace');
        const statAvg = document.getElementById('statAvg');
        
        if (statFiles) statFiles.textContent = AppState.stats.filesCompressed;
        if (statSpace) statSpace.textContent = `${AppState.stats.spaceSaved.toFixed(2)} MB`;
        if (statAvg) statAvg.textContent = `${AppState.stats.avgCompression.toFixed(1)}%`;
        
        const activityDiv = document.getElementById('recentActivity');
        if (activityDiv) {
            if (AppState.stats.history.length === 0) {
                activityDiv.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 2rem;">No compression history yet. Start compressing files!</p>';
            } else {
                activityDiv.innerHTML = AppState.stats.history.slice(-5).reverse().map((item, idx) => {
                    const actualIdx = AppState.stats.history.length - 1 - idx;
                    return `
                        <div class="file-item">
                            <div class="file-header">
                                <span class="file-name">${item.name}</span>
                                <span class="file-size">${item.date}</span>
                            </div>
                            <div class="compression-stats">
                                <span>Original: ${item.originalSize}</span>
                                <span class="stat-success">Saved: ${item.saved}%</span>
                                <span>Compressed: ${item.compressedSize}</span>
                            </div>
                            <div class="action-buttons">
                                <button class="btn btn-outline" onclick="UIController.deleteHistoryItem(${actualIdx})">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    },
    
    // Delete history item
    deleteHistoryItem(index) {
        if (!confirm('Are you sure you want to delete this file from your history?')) {
            return;
        }
        
        const item = AppState.stats.history[index];
        const savedMB = parseFloat(item.originalSize) - parseFloat(item.compressedSize);
        
        AppState.stats.history.splice(index, 1);
        AppState.stats.filesCompressed--;
        AppState.stats.spaceSaved -= savedMB;
        
        if (AppState.stats.filesCompressed > 0) {
            const totalCompression = AppState.stats.history.reduce((sum, h) => sum + parseFloat(h.saved), 0);
            AppState.stats.avgCompression = totalCompression / AppState.stats.filesCompressed;
        } else {
            AppState.stats.avgCompression = 0;
            AppState.stats.spaceSaved = 0;
        }
        
        AppState.saveStats();
        this.updateStatsDisplay();
    },
    
    // Update profile display
    updateProfileDisplay() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileNameInput = document.getElementById('profileNameInput');
        const profileEmailInput = document.getElementById('profileEmailInput');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (profileName) profileName.textContent = AppState.user.name;
        if (profileEmail) profileEmail.textContent = AppState.user.email;
        if (profileNameInput) profileNameInput.value = AppState.user.name;
        if (profileEmailInput) profileEmailInput.value = AppState.user.email;
        
        if (profileAvatar) {
            const initials = AppState.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            profileAvatar.textContent = initials;
        }
    }
};

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('CompressX Application Starting...');
    
    // Initialize state
    AppState.init();
    
    // Initialize authentication
    AuthService.initDemoAccount();
    
    // Render UI
    UIController.render();
    
    console.log('CompressX Application Ready!');

// ============================================================================
// ADMIN PANEL INTEGRATION - FIXED VERSION
// ============================================================================

// Show admin login page
function showAdminLogin() {
    // Check if already logged in as admin
    if (typeof AdminAuth !== 'undefined' && AdminAuth.isAdmin()) {
        showAdminDashboard();
        return;
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-login-container">
            <div class="admin-login-box">
                <h2>🔐 Admin Login</h2>
                <p>Enter admin credentials to access the dashboard</p>
                
                <input type="email" id="adminEmail" placeholder="Admin Email" class="form-input" value="admin@compressx.com" autocomplete="username">
                <input type="password" id="adminPassword" placeholder="Admin Password" class="form-input" autocomplete="current-password">
                
                <button onclick="handleAdminLogin()" class="btn-primary">Login as Admin</button>
                
                <div style="margin-top: 1rem;">
                    <a href="#" onclick="window.location.hash=''; location.reload();" style="color: var(--gray); text-decoration: none;">
                        ← Back to Main Site
                    </a>
                </div>
                
                <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem; color: var(--gray);">
                    <strong>Default Credentials:</strong><br>
                    Email: admin@compressx.com<br>
                    Password: Admin123!<br>
                    <em style="color: #ff6b6b;">⚠️ Change these immediately after first login!</em>
                </div>
            </div>
        </div>
    `;
    
    // Add enter key listener
    setTimeout(() => {
        const passwordField = document.getElementById('adminPassword');
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleAdminLogin();
                }
            });
        }
    }, 100);
}

// Handle admin login
function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (typeof AdminAuth === 'undefined') {
        alert('Admin system is loading... Please wait a moment and try again.');
        return;
    }
    
    if (AdminAuth.verifyAdmin(email, password)) {
        // Set user as admin
        const adminUser = {
            email: email,
            name: 'Administrator',
            role: 'admin'
        };
        localStorage.setItem('compressXUser', JSON.stringify(adminUser));
        AppState.user = adminUser;
        
        // Show admin dashboard
        showAdminDashboard();
    } else {
        alert('Invalid admin credentials');
    }
}

// Show admin dashboard
function showAdminDashboard() {
    if (typeof AdminUI !== 'undefined') {
        AdminUI.showView('dashboard');
    } else {
        alert('Admin dashboard is loading... Please refresh the page.');
    }
}

// Check for admin route immediately
if (window.location.hash === '#admin') {
    // Wait for admin scripts to load
    setTimeout(() => {
        showAdminLogin();
    }, 500);
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
        showAdminLogin();
    } else if (window.location.hash === '') {
        // Return to main app
        if (typeof AdminAuth !== 'undefined' && !AdminAuth.isAdmin()) {
            location.reload();
        }
    }
});

// Add keyboard shortcut (Ctrl+Shift+A)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        window.location.hash = '#admin';
        showAdminLogin();
    }
});

console.log('Admin integration loaded - Access at /#admin');
