// Core application functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  // Initialize mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Initialize smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', smoothScroll);
  });

  // Initialize data upload functionality
  const fileUploadForm = document.getElementById('file-upload-form');
  if (fileUploadForm) {
    fileUploadForm.addEventListener('submit', handleFileUpload);
  }
});

/**
 * Toggles dark mode on the document
 */
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

/**
 * Smooth scroll to anchor
 */
function smoothScroll(e) {
  e.preventDefault();
  const targetId = this.getAttribute('href');
  const targetElement = document.querySelector(targetId);
  
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Handles file upload submission
 */
async function handleFileUpload(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;

  try {
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <i class="fas fa-spinner fa-spin mr-2"></i>
      Procesando...
    `;

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();
    showUploadSuccess(result);
  } catch (error) {
    showUploadError(error.message);
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Displays upload success message
 */
function showUploadSuccess(data) {
  const alert = document.createElement('div');
  alert.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
  alert.innerHTML = `
    <strong>¡Éxito!</strong> ${data.message}
    <button class="absolute top-0 right-0 px-2 py-1" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

/**
 * Displays upload error message
 */
function showUploadError(message) {
  const alert = document.createElement('div');
  alert.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
  alert.innerHTML = `
    <strong>Error:</strong> ${message}
    <button class="absolute top-0 right-0 px-2 py-1" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

// Initialize any stored preferences
function initPreferences() {
  // Dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
  }
}

// Initialize the app
initPreferences();