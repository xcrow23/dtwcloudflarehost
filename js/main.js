/**
 * Dream the Wilderness - Main Navigation & DOM Management
 * Handles section navigation, mobile menu, and page initialization
 * Uses event delegation for better maintainability and performance
 */

/**
 * Show a content section and hide others
 * @param {string} sectionName - ID of the section to show
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
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Find and activate the corresponding nav link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close mobile menu if open
    const navLinksContainer = document.getElementById('navLinks');
    if (navLinksContainer) {
        navLinksContainer.classList.remove('active');
    }

    // Update URL hash for browser history and shareable links
    window.history.pushState(
        { section: sectionName },
        `Dream the Wilderness - ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`,
        `#${sectionName}`
    );

    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Setup navigation link delegation
 * Handles clicks on all links with data-section attribute
 */
function setupNavigationDelegation() {
    document.addEventListener('click', function(event) {
        // Check if clicked element or its parent has data-section attribute
        let target = event.target;
        while (target && target !== document) {
            if (target.hasAttribute('data-section')) {
                event.preventDefault();
                const sectionName = target.getAttribute('data-section');
                showSection(sectionName);
                return;
            }
            target = target.parentElement;
        }
    });
}

/**
 * Setup mobile menu toggle delegation
 */
function setupMobileMenuToggle() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const navLinks = document.getElementById('navLinks');
            navLinks.classList.toggle('active');
            // Update aria-expanded attribute for accessibility
            const isExpanded = navLinks.classList.contains('active');
            toggleBtn.setAttribute('aria-expanded', isExpanded);
        });
    }
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
            const toggleBtn = document.querySelector('.mobile-menu-toggle');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
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
    // Setup event handlers first
    setupNavigationDelegation();
    setupMobileMenuToggle();
    setupMobileMenuClickHandler();
    setupPopstateHandler();

    // Check for hash in URL on initial load
    const hash = window.location.hash.substring(1);
    const initialSection = (hash && document.getElementById(hash)) ? hash : 'home';

    // Set initial section (without adding to history since it's page load)
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(initialSection);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav link highlight for initial section
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-section="${initialSection}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load blog posts
    loadSubstackPosts();
});
