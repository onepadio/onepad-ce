/**
 * Login Form Detection and Auto-fill System
 * Injected into webviews to detect login forms and enable password management
 */

export interface LoginFormData {
  url: string;
  hostname: string;
  username: string;
  password: string;
  usernameField?: HTMLInputElement;
  passwordField?: HTMLInputElement;
  form?: HTMLFormElement;
}

export interface DetectedForm {
  form: HTMLFormElement | null;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement;
  confidence: number;
  isMultiStep: boolean;
}

/**
 * Generate injectable script for webview
 * This script runs in the webview context and detects login forms
 */
export function generateFormDetectionScript(): string {
  return `
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.__onepad_password_manager_injected) {
    return;
  }
  window.__onepad_password_manager_injected = true;

  console.log('[OnePad] Password manager script injected');

  // Store detected forms
  const detectedForms = new Map();
  let detectedEmail = null;
  let detectedUrl = null;

  /**
   * Check if element is a password field
   */
  function isPasswordField(element) {
    if (!(element instanceof HTMLInputElement)) return false;
    
    return (
      element.type === 'password' ||
      element.autocomplete === 'current-password' ||
      element.autocomplete === 'new-password' ||
      /pass|pwd|password|passcode/i.test(element.name || '') ||
      /pass|pwd|password|passcode/i.test(element.id || '') ||
      /pass|pwd|password|passcode/i.test(element.placeholder || '') ||
      /pass|pwd|password|passcode/i.test(element.getAttribute('aria-label') || '')
    );
  }

  /**
   * Check if element is a username/email field
   */
  function isUsernameField(element) {
    if (!(element instanceof HTMLInputElement)) return false;
    if (element.type === 'password') return false;
    
    const autocomplete = element.autocomplete;
    const name = (element.name || '').toLowerCase();
    const id = (element.id || '').toLowerCase();
    const type = element.type;
    const placeholder = (element.placeholder || '').toLowerCase();
    
    return (
      autocomplete === 'username' ||
      autocomplete === 'email' ||
      type === 'email' ||
      /user|email|login|account|identifier/i.test(name) ||
      /user|email|login|account|identifier/i.test(id) ||
      /user|email|login|account/i.test(placeholder)
    );
  }

  /**
   * Calculate confidence that this is a login form
   */
  function calculateLoginConfidence(form, passwordField, usernameField) {
    let confidence = 0;
    
    // Positive signals
    if (passwordField) confidence += 50;
    if (usernameField) confidence += 30;
    
    // Check form action
    const action = form?.action || '';
    if (/login|signin|auth/i.test(action)) confidence += 10;
    
    // Check submit button text
    const submitButton = form?.querySelector('button[type="submit"], input[type="submit"]');
    const submitText = (submitButton?.textContent || '').toLowerCase();
    if (/login|sign in|log in/i.test(submitText)) confidence += 20;
    
    // Negative signals (probably not login)
    if (/register|sign up|create account/i.test(submitText)) confidence -= 40;
    if (form?.querySelector('input[name*="confirm"]')) confidence -= 30; // Registration
    if (form && form.querySelectorAll('input').length > 8) confidence -= 20; // Too many fields
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Find login forms on the page
   */
  function detectLoginForms() {
    const forms = [];
    
    // Find all password fields (including those not in forms)
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(passwordField => {
      // Find associated form or container
      const form = passwordField.closest('form') || 
                   passwordField.closest('[role="form"]') ||
                   passwordField.closest('div');
      
      // Find nearby username field
      let usernameField = null;
      
      if (form) {
        // Look for username field in same form
        const inputs = form.querySelectorAll('input[type="email"], input[type="text"]');
        for (const input of inputs) {
          if (isUsernameField(input)) {
            usernameField = input;
            break;
          }
        }
      }
      
      // Calculate confidence
      const confidence = calculateLoginConfidence(form, passwordField, usernameField);
      
      if (confidence > 60) {
        forms.push({
          form: form instanceof HTMLFormElement ? form : null,
          usernameField,
          passwordField,
          confidence,
          isMultiStep: !usernameField // Multi-step if no username field found
        });
        
        console.log('[OnePad] Login form detected with confidence:', confidence);
      }
    });
    
    return forms;
  }

  /**
   * Attach listeners to detected form
   */
  function attachFormListeners(detectedForm) {
    const { form, usernameField, passwordField } = detectedForm;
    
    // Listen for form submission
    const submitHandler = (e) => {
      const username = usernameField?.value || detectedEmail || '';
      const password = passwordField.value;
      
      if (password) {
        console.log('[OnePad] Login detected');
        
        // Send to parent
        window.postMessage({
          type: 'ONEPAD_LOGIN_DETECTED',
          data: {
            url: window.location.href,
            hostname: window.location.hostname,
            username: username,
            password: password
          }
        }, '*');
      }
    };
    
    if (form) {
      form.addEventListener('submit', submitHandler);
    }
    
    // Also listen for Enter key on password field
    passwordField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setTimeout(() => submitHandler(e), 100);
      }
    });
    
    // Listen for clicks on submit buttons
    const submitButtons = form?.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
    submitButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => submitHandler(new Event('submit')), 100);
      });
    });
    
    // Track email for multi-step login
    if (usernameField) {
      usernameField.addEventListener('blur', () => {
        if (usernameField.value) {
          detectedEmail = usernameField.value;
          detectedUrl = window.location.hostname;
        }
      });
    }
  }

  /**
   * Auto-fill credentials
   */
  function autofillCredentials(username, password) {
    console.log('[OnePad] Auto-filling credentials');
    
    const forms = detectLoginForms();
    
    if (forms.length > 0) {
      const form = forms[0]; // Use highest confidence form
      
      if (form.usernameField && username) {
        form.usernameField.value = username;
        form.usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        form.usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Visual indicator
        form.usernameField.style.backgroundColor = '#e8f0fe';
      }
      
      if (form.passwordField && password) {
        form.passwordField.value = password;
        form.passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        form.passwordField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Show password suggestion overlay
   */
  function showPasswordSuggestion(passwords) {
    // Remove existing overlay
    const existingOverlay = document.getElementById('onepad-password-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    if (!passwords || passwords.length === 0) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'onepad-password-overlay';
    overlay.style.cssText = \`
      position: fixed;
      top: 50px;
      right: 20px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    overlay.innerHTML = \`
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
        🔐 OnePad Password Manager
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
        Select a password to auto-fill:
      </div>
    \`;
    
    passwords.forEach((pwd, index) => {
      const item = document.createElement('div');
      item.style.cssText = \`
        padding: 8px;
        margin: 4px 0;
        background: #f5f5f5;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      \`;
      item.textContent = pwd.username + ' • ' + pwd.hostname;
      item.addEventListener('click', () => {
        window.postMessage({
          type: 'ONEPAD_AUTOFILL_SELECTED',
          data: { passwordId: pwd.id }
        }, '*');
        overlay.remove();
      });
      overlay.appendChild(item);
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = \`
      margin-top: 8px;
      padding: 4px 12px;
      border: none;
      background: #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    \`;
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.appendChild(closeBtn);
    
    document.body.appendChild(overlay);
    
    // Auto-close after 30 seconds
    setTimeout(() => overlay.remove(), 30000);
  }

  /**
   * Listen for messages from parent
   */
  window.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'ONEPAD_AUTOFILL':
        autofillCredentials(data.username, data.password);
        break;
      
      case 'ONEPAD_SHOW_SUGGESTIONS':
        showPasswordSuggestion(data.passwords);
        break;
      
      case 'ONEPAD_INJECT_PASSWORD':
        // Insert generated password into active password field
        const activeElement = document.activeElement;
        if (activeElement && isPasswordField(activeElement)) {
          activeElement.value = data.password;
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        break;
    }
  });

  /**
   * Initial scan and setup
   */
  function initialize() {
    const forms = detectLoginForms();
    
    forms.forEach(form => {
      attachFormListeners(form);
      detectedForms.set(form.passwordField, form);
    });
    
    // Notify parent that forms were detected
    if (forms.length > 0) {
      window.postMessage({
        type: 'ONEPAD_FORMS_DETECTED',
        data: {
          count: forms.length,
          url: window.location.href,
          hostname: window.location.hostname
        }
      }, '*');
    }
  }

  /**
   * Watch for dynamically added forms (SPAs)
   */
  const observer = new MutationObserver((mutations) => {
    let shouldRescan = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if it's a form or contains forms/inputs
          if (node.tagName === 'FORM' || 
              node.tagName === 'INPUT' ||
              node.querySelector('form') ||
              node.querySelector('input[type="password"]')) {
            shouldRescan = true;
          }
        }
      });
    });
    
    if (shouldRescan) {
      setTimeout(initialize, 500); // Debounce
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial setup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Re-scan on page navigation (SPAs)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(initialize, 1000);
    }
  }, 1000);

  console.log('[OnePad] Password manager ready');
})();
  `;
}

/**
 * Parse login detection message from webview
 */
export function parseLoginDetection(message: any): LoginFormData | null {
  if (message.type === 'ONEPAD_LOGIN_DETECTED') {
    return {
      url: message.data.url,
      hostname: message.data.hostname,
      username: message.data.username,
      password: message.data.password
    };
  }
  return null;
}

export default {
  generateFormDetectionScript,
  parseLoginDetection
};
