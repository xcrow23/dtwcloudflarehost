/**
 * Dream the Wilderness - Main Navigation & DOM Management
 * Handles section navigation, mobile menu, and page initialization
 */

/**
 * Show a content section and hide others
 * @param {string} sectionName - ID of the section to show
 * @returns {boolean} false (for onclick handlers)
 */
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Find and activate the corresponding nav link
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close mobile menu if open
    document.getElementById('navLinks').classList.remove('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Prevent default link behavior
    return false;
}

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

/**
 * Close mobile menu when clicking outside navigation
 */
function setupMobileMenuClickHandler() {
    document.addEventListener('click', function(event) {
        const nav = document.querySelector('nav');
        const navLinks = document.getElementById('navLinks');

        if (!nav.contains(event.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });
}

/**
 * Handle browser back/forward buttons for SPA navigation
 */
function setupPopstateHandler() {
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            showSection(event.state.section);
        }
    });
}

/**
 * Initialize page on DOM ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set initial section
    showSection('home');

    // Setup event handlers
    setupMobileMenuClickHandler();
    setupPopstateHandler();

    // Load blog posts
    loadSubstackPosts();
});
