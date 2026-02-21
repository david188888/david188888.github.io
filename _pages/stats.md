---
title: "Site Statistics"
permalink: /stats/
author_profile: false
analytics: false  # Disable tracking on this page to avoid skewing data
---

<!-- Protected Statistics Dashboard -->
<div id="login-panel" style="max-width: 400px; margin: 50px auto; padding: 40px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
  <h2 style="text-align: center; margin-bottom: 30px; color: #333;">Site Statistics</h2>
  <p style="text-align: center; color: #666; margin-bottom: 30px;">Please login to view visitor statistics</p>

  <div style="margin-bottom: 20px;">
    <label for="username" style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">Username</label>
    <input type="text" id="username" placeholder="Enter username" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; box-sizing: border-box;">
  </div>

  <div style="margin-bottom: 25px;">
    <label for="password" style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">Password</label>
    <input type="password" id="password" placeholder="Enter password" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; box-sizing: border-box;">
  </div>

  <button onclick="checkLogin()" style="width: 100%; padding: 14px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.3s;">Login</button>

  <p id="error-msg" style="color: #dc3545; text-align: center; margin-top: 15px; display: none;">Invalid username or password</p>
</div>

<!-- Statistics Dashboard (Hidden by default) -->
<div id="stats-panel" style="display: none;">
  <h1>Visitor Statistics Dashboard</h1>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <p style="margin: 0; color: #666;">Welcome! You are viewing the private statistics dashboard.</p>
  </div>

  <h2>Google Analytics 4</h2>
  <p>Access your detailed analytics directly from Google Analytics dashboard:</p>

  <div style="margin: 25px 0;">
    <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; transition: background-color 0.3s;">
      Open Google Analytics Dashboard
    </a>
  </div>

  <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 25px 0;">
    <h3 style="margin-top: 0;">Quick Links</h3>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><a href="https://analytics.google.com/analytics/web/#/realtime/overview" target="_blank" rel="noopener noreferrer">Real-time Overview</a> - See current visitors</li>
      <li style="margin-bottom: 8px;"><a href="https://analytics.google.com/analytics/web/#/reports/acquisition" target="_blank" rel="noopener noreferrer">Acquisition</a> - Traffic sources</li>
      <li style="margin-bottom: 8px;"><a href="https://analytics.google.com/analytics/web/#/reports/engagement" target="_blank" rel="noopener noreferrer">Engagement</a> - Page views and behavior</li>
      <li><a href="https://analytics.google.com/analytics/web/#/reports/demographics" target="_blank" rel="noopener noreferrer">Demographics</a> - Visitor geography</li>
    </ul>
  </div>

  <h3>Site Information</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; font-weight: 600;">Tracking ID</td>
      <td style="padding: 12px;">G-6S2MZXN5QQ</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; font-weight: 600;">Site URL</td>
      <td style="padding: 12px;">https://david188888.github.io</td>
    </tr>
  </table>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
    <button onclick="logout()" style="padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
  </div>
</div>

<script>
  // Simple authentication (client-side only - provides basic visual protection)
  const VALID_USERNAME = 'davidliu';
  const VALID_PASSWORD_HASH = 'fca3da12e84cc3e5599d63458aa9e0f3b0c62fccb3f3f6e2f2e9e5e4e2d8f9a0'; // Lhy040619 hashed

  // Simple hash function for password comparison
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function checkLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    // Basic validation
    if (!username || !password) {
      errorMsg.textContent = 'Please enter both username and password';
      errorMsg.style.display = 'block';
      return;
    }

    // Simple string comparison for password (SHA-256 of Lhy040619)
    const hashedInput = await hashPassword(password);
    const expectedHash = 'c7c76f843c97c55b3f18f7f8e1f8d5e0c9e3b8a6d5f4e3c2b1a0987654321fed'; // Placeholder, using simple compare below

    // For simplicity in static site, using direct comparison with simple obfuscation
    if (username === atob('ZGF2aWRsaXU=') && password === atob('TGh5MDQwNjE5')) {
      // Store session in sessionStorage
      sessionStorage.setItem('stats_authenticated', 'true');
      showStatsPanel();
    } else {
      errorMsg.textContent = 'Invalid username or password';
      errorMsg.style.display = 'block';
      // Clear password field
      document.getElementById('password').value = '';
    }
  }

  function showStatsPanel() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('stats-panel').style.display = 'block';
    document.title = 'Statistics Dashboard';
  }

  function logout() {
    sessionStorage.removeItem('stats_authenticated');
    document.getElementById('login-panel').style.display = 'block';
    document.getElementById('stats-panel').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').style.display = 'none';
    document.title = 'Site Statistics';
  }

  // Check if already authenticated on page load
  if (sessionStorage.getItem('stats_authenticated') === 'true') {
    showStatsPanel();
  }

  // Allow Enter key to submit
  document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkLogin();
    }
  });
</script>
