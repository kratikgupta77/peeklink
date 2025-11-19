const storageKey = "apiBase";
const defaultBase = "http://127.0.0.1:8000";

function getApiBase() {
  return new Promise(res => {
    chrome.storage.sync.get([storageKey], v => res((v && v[storageKey]) || defaultBase));
  });
}

function showError(msg) {
  const errEl = document.getElementById("error");
  const succEl = document.getElementById("success");
  errEl.textContent = msg;
  errEl.style.display = "block";
  succEl.style.display = "none";
}

function showSuccess(msg) {
  const errEl = document.getElementById("error");
  const succEl = document.getElementById("success");
  succEl.textContent = msg;
  succEl.style.display = "block";
  errEl.style.display = "none";
}

function hideMessages() {
  document.getElementById("error").style.display = "none";
  document.getElementById("success").style.display = "none";
}

async function shorten(url, requirePassword, password, expiresAt, maxClicks) {
  const base = await getApiBase();
  const payload = {
    target: url,
    require_password: requirePassword || false,
    analytics_opt_in: true
  };
  
  if (password && requirePassword) {
    payload.password = password;
  }
  
  if (expiresAt) {
    payload.expires_at = expiresAt;
  }
  
  if (maxClicks !== null && maxClicks !== undefined) {
    payload.max_clicks = parseInt(maxClicks);
  }
  
  const resp = await fetch(`${base}/api/links/create`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  
  if (!resp.ok) {
    let msg = `API ${resp.status}`;
    try {
      const errJson = await resp.json();
      msg = errJson.message || errJson.error || msg;
    } catch (_) {
      // If response is not JSON, try to get text
      try {
        const text = await resp.text();
        if (text) msg = text.substring(0, 100);
      } catch (_) {}
    }
    throw new Error(msg);
  }
  
  return resp.json(); // {id, target, short_url}
}

function openPreview(id) {
  getApiBase().then(base => {
    chrome.tabs.create({ url: `${base}/p/${id}` });
  });
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url');
  const useTabBtn = document.getElementById('useTab');
  const shortenBtn = document.getElementById('shorten');
  const requirePasswordCheckbox = document.getElementById('requirePassword');
  const passwordInput = document.getElementById('password');
  const expiryTypeSelect = document.getElementById('expiryType');
  const expiresAtInput = document.getElementById('expiresAt');
  const maxClicksInput = document.getElementById('maxClicks');
  const linkCreatedDiv = document.getElementById('linkCreated');
  const viewAnalyticsBtn = document.getElementById('viewAnalytics');
  const copyLinkBtn = document.getElementById('copyLink');

  // Toggle password input visibility
  requirePasswordCheckbox.addEventListener('change', () => {
    passwordInput.style.display = requirePasswordCheckbox.checked ? 'block' : 'none';
    if (!requirePasswordCheckbox.checked) {
      passwordInput.value = '';
    }
  });

  // Toggle expiry input visibility
  expiryTypeSelect.addEventListener('change', () => {
    const expiryType = expiryTypeSelect.value;
    expiresAtInput.style.display = expiryType === 'time' ? 'block' : 'none';
    maxClicksInput.style.display = expiryType === 'clicks' ? 'block' : 'none';
    
    if (expiryType !== 'time') {
      expiresAtInput.value = '';
    } else {
      // Set minimum date to now
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      expiresAtInput.min = now.toISOString().slice(0, 16);
    }
    
    if (expiryType !== 'clicks') {
      maxClicksInput.value = '';
    }
  });

  // Use current tab
  useTabBtn.onclick = async () => {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      if (tab && tab.url) {
        urlInput.value = tab.url;
        hideMessages();
      }
    } catch (e) {
      showError("Failed to get current tab URL: " + e.message);
    }
  };

  // Shorten button
  shortenBtn.onclick = async () => {
    hideMessages();
    
    let u = (urlInput.value || "").trim();
    if (!/^https?:\/\//i.test(u)) {
      showError("Enter a valid http(s) URL");
      return;
    }

    // Validate password if required
    const requirePw = requirePasswordCheckbox.checked;
    const pw = passwordInput.value.trim();
    if (requirePw && !pw) {
      showError("Password is required when password protection is enabled");
      return;
    }

    // Validate expiry if set
    const expiryType = expiryTypeSelect.value;
    let expiresAt = null;
    let maxClicks = null;
    
    if (expiryType === 'time') {
      const expiryValue = expiresAtInput.value;
      if (!expiryValue) {
        showError("Please select an expiry date and time");
        return;
      }
      // Convert to ISO format for backend
      expiresAt = new Date(expiryValue).toISOString();
    } else if (expiryType === 'clicks') {
      const clicksValue = maxClicksInput.value;
      if (!clicksValue || parseInt(clicksValue) < 1) {
        showError("Please enter a valid number of clicks (minimum 1)");
        return;
      }
      maxClicks = parseInt(clicksValue);
    }

    shortenBtn.disabled = true;
    shortenBtn.textContent = "Creating...";
    linkCreatedDiv.style.display = "none";
    
    try {
      const data = await shorten(u, requirePw, pw, expiresAt, maxClicks);
      
      // Store link data for analytics button
      linkCreatedDiv.dataset.linkId = data.id;
      linkCreatedDiv.dataset.shortUrl = data.short_url || `${await getApiBase()}/r/${data.id}`;
      
      showSuccess("Link created successfully!");
      linkCreatedDiv.style.display = "block";
      
      // Reset form (but keep link created section visible)
      urlInput.value = "";
      requirePasswordCheckbox.checked = false;
      passwordInput.value = "";
      passwordInput.style.display = "none";
      expiryTypeSelect.value = "none";
      expiresAtInput.value = "";
      expiresAtInput.style.display = "none";
      maxClicksInput.value = "";
      maxClicksInput.style.display = "none";
      
      // Open preview after a short delay
      setTimeout(() => {
        openPreview(data.id);
      }, 500);
    } catch (e) {
      showError("Failed: " + e.message);
      linkCreatedDiv.style.display = "none";
    } finally {
      shortenBtn.disabled = false;
      shortenBtn.textContent = "Shorten & Preview";
    }
  };

  // Allow Enter key to trigger shorten
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      shortenBtn.click();
    }
  });

  // View Analytics button
  viewAnalyticsBtn.onclick = async () => {
    const linkId = linkCreatedDiv.dataset.linkId;
    if (!linkId) return;
    
    // Get dashboard URL from storage or use default
    const dashboardKey = "dashboardBase";
    const defaultDashboard = "http://127.0.0.1:5173";
    
    chrome.storage.sync.get([dashboardKey], (v) => {
      const dashboardBase = (v && v[dashboardKey]) || defaultDashboard;
      // Open links page - user can find their link there
      chrome.tabs.create({ url: `${dashboardBase}/links` });
    });
  };

  // Copy Link button
  copyLinkBtn.onclick = async () => {
    const shortUrl = linkCreatedDiv.dataset.shortUrl;
    if (!shortUrl) return;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      showSuccess("Link copied to clipboard!");
      setTimeout(() => {
        hideMessages();
      }, 2000);
    } catch (e) {
      showError("Failed to copy link: " + e.message);
    }
  };
});
