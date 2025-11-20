/**
 * Dream the Wilderness - Contact Form Handler
 * Manages contact form submission and response handling
 * Uses event delegation for form submission handling
 */

/**
 * Clear all field-specific errors
 */
function clearFieldErrors() {
    const form = document.getElementById('contactForm');
    const inputs = form.querySelectorAll('.form-input, .form-textarea, .form-select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });

    const errorSpans = form.querySelectorAll('.field-error');
    errorSpans.forEach(span => {
        span.textContent = '';
        span.classList.remove('show');
    });
}

/**
 * Show field-specific error
 * @param {string} fieldName - ID of the field
 * @param {string} message - Error message
 */
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorSpan = document.getElementById(fieldName + '-error');

    if (field) {
        field.classList.add('error');
    }

    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.add('show');
    }
}

/**
 * Validate form inputs before submission
 * @returns {boolean} true if valid, false otherwise
 */
function validateContactForm() {
    const form = document.getElementById('contactForm');
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    // Clear previous errors
    clearFieldErrors();

    let isValid = true;

    // Validate name
    if (!name || name.length < 2) {
        showFieldError('name', 'Please enter a valid name (at least 2 characters)');
        isValid = false;
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate message
    if (!message || message.length < 10) {
        showFieldError('message', 'Please enter a message with at least 10 characters');
        isValid = false;
    }

    return isValid;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} true if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show form-level message (for success or non-field errors like CAPTCHA)
 * @param {string} message - Message text
 * @param {string} type - 'success' or 'error'
 */
function showFormMessage(message, type = 'error') {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = message;
    messageDiv.classList.remove('success', 'error');
    messageDiv.classList.add(type);
}

/**
 * Show form validation error (general, for CAPTCHA and other non-field errors)
 * @param {string} message - Error message
 */
function showFormValidationError(message) {
    showFormMessage(message, 'error');
}

/**
 * Setup contact form handlers
 */
function setupContactFormHandler() {
    const form = document.getElementById('contactForm');
    if (form) {
        // Form submission
        form.addEventListener('submit', handleFormSubmit);

        // Clear field errors on input
        const fields = form.querySelectorAll('.form-input, .form-textarea, .form-select');
        fields.forEach(field => {
            field.addEventListener('focus', function() {
                // Clear error for this specific field
                this.classList.remove('error');
                const errorSpan = document.getElementById(this.id + '-error');
                if (errorSpan) {
                    errorSpan.textContent = '';
                    errorSpan.classList.remove('show');
                }
            });

            // Also clear on input to give real-time feedback
            field.addEventListener('input', function() {
                this.classList.remove('error');
                const errorSpan = document.getElementById(this.id + '-error');
                if (errorSpan) {
                    errorSpan.textContent = '';
                    errorSpan.classList.remove('show');
                }
            });
        });
    }
}

/**
 * Handle contact form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    // Validate form first
    if (!validateContactForm()) {
        return;
    }

    // Check Turnstile token
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]');
    if (!turnstileToken || !turnstileToken.value) {
        showFormValidationError('Please complete the security verification');
        return;
    }

    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('formMessage');

    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    messageDiv.classList.remove('success', 'error');

    try {
        const formData = new FormData(form);

        // Add 10-second timeout to form submission
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('/contact', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId); // Cancel timeout on response

        // Handle network errors
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Success message
            showFormMessage(
                result.message || 'Thank you! Your message has been sent successfully.',
                'success'
            );
            // Clear any field errors
            clearFieldErrors();

            // Reset form after short delay
            setTimeout(() => {
                form.reset();
            }, 500);
        } else {
            // Error message from server
            showFormMessage(
                result.error || 'An error occurred. Please try again.',
                'error'
            );
        }
    } catch (error) {
        console.error('Form submission error:', error);

        // Provide specific error message for timeouts
        const errorMessage = error.name === 'AbortError'
            ? 'The request took too long. Please check your connection and try again.'
            : 'Sorry, there was an error sending your message. Please try again or email hello@dreamthewilderness.com directly.';

        showFormMessage(errorMessage, 'error');
    } finally {
        // Reset button
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
    }
}

/**
 * Initialize contact form handlers on DOM ready
 */
document.addEventListener('DOMContentLoaded', function() {
    setupContactFormHandler();
});
