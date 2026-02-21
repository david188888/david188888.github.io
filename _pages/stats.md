---
title: "Site Statistics"
permalink: /stats/
author_profile: false
analytics: false  # Disable tracking on this page to avoid skewing data
---

<style>
/* Dark Premium Login Theme */
.stats-container {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* Login Card */
.login-card {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(145deg, #1e1e2e 0%, #252538 100%);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: card-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes card-entrance {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ambient Glow */
.login-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.login-header h2 {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.login-header p {
  font-size: 15px;
  color: #a0a0b0;
  margin: 0;
  font-weight: 400;
}

/* Lock Icon */
.lock-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 10px 30px -10px rgba(99, 102, 241, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.lock-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

/* Form Fields */
.form-field {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #c0c0d0;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-field input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  font-weight: 400;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.form-field input::placeholder {
  color: #606070;
}

.form-field input:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.35);
}

.form-field input:focus {
  border-color: #6366f1;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

/* Login Button */
.login-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 6px -1px rgba(99, 102, 241, 0.3),
    0 2px 4px -2px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 20px -5px rgba(99, 102, 241, 0.4),
    0 4px 6px -2px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.login-btn:active {
  transform: translateY(0);
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover::before {
  left: 100%;
}

/* Error Message */
.error-msg {
  color: #f87171;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.2);
  display: none;
  position: relative;
  z-index: 1;
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}

/* Stats Panel (Dashboard) */
#stats-panel {
  display: none;
  animation: panel-fade-in 0.5s ease forwards;
}

@keyframes panel-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-dashboard {
  max-width: 1000px;
  margin: 0 auto;
}

.stats-dashboard h1 {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.stats-subtitle {
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 32px;
}

/* Dashboard Cards */
.dashboard-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.dashboard-card h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.dashboard-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.dashboard-card p {
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

/* Primary Button */
.btn-primary {
  display: inline-block;
  padding: 14px 28px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
}

/* Quick Links Card */
.quick-links {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.quick-links ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.quick-links li {
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.quick-links li:last-child {
  border-bottom: none;
}

.quick-links a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.quick-links a:hover {
  color: #4f46e5;
}

.quick-links li span {
  color: #9ca3af;
  font-size: 14px;
}

/* Info Table */
.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.info-table tr {
  border-bottom: 1px solid #e5e7eb;
}

.info-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.info-table td:first-child {
  font-weight: 600;
  color: #374151;
  width: 140px;
}

.info-table td:last-child {
  color: #6b7280;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 14px;
}

/* Logout Button */
.btn-secondary {
  padding: 12px 24px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Responsive */
@media (max-width: 640px) {
  .login-card {
    padding: 36px 24px;
    margin: 20px;
  }

  .login-header h2 {
    font-size: 24px;
  }

  .stats-dashboard h1 {
    font-size: 28px;
  }

  .dashboard-card {
    padding: 20px;
  }
}
</style>

<!-- Protected Statistics Dashboard -->
<div id="login-panel" class="stats-container">
  <div class="login-card">
    <div class="login-header">
      <div class="lock-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2>Site Statistics</h2>
      <p>Enter your credentials to access the dashboard</p>
    </div>

    <div class="form-field">
      <label for="username">Username</label>
      <input type="text" id="username" placeholder="Enter username" autocomplete="username">
    </div>

    <div class="form-field">
      <label for="password">Password</label>
      <input type="password" id="password" placeholder="Enter password" autocomplete="current-password">
    </div>

    <button type="button" onclick="window.checkLogin(); return false;" class="login-btn">Sign In</button>

    <p id="error-msg" class="error-msg">Invalid username or password</p>
  </div>
</div>

<!-- Statistics Dashboard (Hidden by default) -->
<div id="stats-panel">
  <div class="stats-dashboard">
    <h1>Visitor Statistics Dashboard</h1>
    <p class="stats-subtitle">Welcome back! View your site's performance metrics below.</p>

    <div class="dashboard-card">
      <h2>Google Analytics 4</h2>
      <p>Access your detailed analytics directly from the Google Analytics dashboard for comprehensive visitor insights.</p>
      <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer" class="btn-primary">
        Open Google Analytics Dashboard
      </a>
    </div>

    <div class="dashboard-card quick-links">
      <h3>Quick Links</h3>
      <ul>
        <li>
          <a href="https://analytics.google.com/analytics/web/#/realtime/overview" target="_blank" rel="noopener noreferrer">Real-time Overview</a>
          <span> — See current active visitors and their locations</span>
        </li>
        <li>
          <a href="https://analytics.google.com/analytics/web/#/reports/acquisition" target="_blank" rel="noopener noreferrer">Acquisition</a>
          <span> — Traffic sources and user acquisition channels</span>
        </li>
        <li>
          <a href="https://analytics.google.com/analytics/web/#/reports/engagement" target="_blank" rel="noopener noreferrer">Engagement</a>
          <span> — Page views, session duration, and user behavior</span>
        </li>
        <li>
          <a href="https://analytics.google.com/analytics/web/#/reports/demographics" target="_blank" rel="noopener noreferrer">Demographics</a>
          <span> — Visitor geography, countries, and cities</span>
        </li>
      </ul>
    </div>

    <div class="dashboard-card">
      <h3>Site Information</h3>
      <table class="info-table">
        <tr>
          <td>Tracking ID</td>
          <td>G-6S2MZXN5QQ</td>
        </tr>
        <tr>
          <td>Site URL</td>
          <td>https://david188888.github.io</td>
        </tr>
      </table>
    </div>

    <div class="dashboard-card" style="text-align: center;">
      <button type="button" onclick="window.logout()" class="btn-secondary">Logout</button>
    </div>
  </div>
</div>

<script>
(function() {
  'use strict';

  // Make functions globally available for onclick handlers
  window.checkLogin = function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    // Basic validation
    if (!username || !password) {
      errorMsg.textContent = 'Please enter both username and password';
      errorMsg.style.display = 'block';
      return false;
    }

    // Simple base64 obfuscation for credentials
    // username: davidliu, password: Lhy040619
    var expectedUser = '';
    var expectedPass = '';
    try {
      expectedUser = atob('ZGF2aWRsaXU=');
      expectedPass = atob('TGh5MDQwNjE5');
    } catch (e) {
      errorMsg.textContent = 'Authentication error. Please try again.';
      errorMsg.style.display = 'block';
      return false;
    }

    if (username === expectedUser && password === expectedPass) {
      // Store session in sessionStorage
      sessionStorage.setItem('stats_authenticated', 'true');
      showStatsPanel();
    } else {
      errorMsg.textContent = 'Invalid username or password';
      errorMsg.style.display = 'block';
      // Clear password field
      document.getElementById('password').value = '';
    }
    return false;
  };

  window.showStatsPanel = function() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('stats-panel').style.display = 'block';
    document.title = 'Statistics Dashboard';
  };

  window.logout = function() {
    sessionStorage.removeItem('stats_authenticated');
    document.getElementById('login-panel').style.display = 'flex';
    document.getElementById('stats-panel').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').style.display = 'none';
    document.title = 'Site Statistics';
  };

  // Initialize when DOM is ready
  function init() {
    // Check if already authenticated on page load
    if (sessionStorage.getItem('stats_authenticated') === 'true') {
      showStatsPanel();
    }

    // Allow Enter key to submit
    var passwordField = document.getElementById('password');
    var usernameField = document.getElementById('username');

    if (passwordField) {
      passwordField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.checkLogin();
        }
      });
    }

    if (usernameField) {
      usernameField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var passField = document.getElementById('password');
          if (passField) passField.focus();
        }
      });
    }
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
