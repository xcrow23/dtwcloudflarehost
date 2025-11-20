/**
 * Dream the Wilderness - Contact Form Handler
 * Manages contact form submission and response handling
 */

/**
 * Validate form inputs before submission
 * @returns {boolean} true if valid, false otherwise
 */
function validateContactForm() {
    const form = document.getElementById('contactForm');
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    // Basic validation
    if (!name || name.length < 2) {
        showFormValidationError('Please enter a valid name (at least 2 characters)');
        return false;
    }

    if (!email || !isValidEmail(email)) {
        showFormValidationError('Please enter a valid email address');
        return false;
    }

    if (!message || message.length < 10) {
        showFormValidationError('Please enter a message with at least 10 characters');
        return false;
    }

    return true;
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
 * Show form validation error
 * @param {string} message - Error message
 */
function showFormValidationError(message) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = message;
    messageDiv.classList.remove('success');
    messageDiv.classList.add('error');
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

    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('formMessage');

    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    messageDiv.classList.remove('success', 'error');

    try {
        const formData = new FormData(form);

        const response = await fetch('/contact', {
            method: 'POST',
            body: formData
        });

        // Handle network errors
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Success message
            messageDiv.innerHTML = result.message || 'Thank you! Your message has been sent successfully.';
            messageDiv.classList.remove('error');
            messageDiv.classList.add('success');

            // Reset form after short delay
            setTimeout(() => {
                form.reset();
            }, 500);
        } else {
            // Error message from server
            messageDiv.innerHTML = result.error || 'An error occurred. Please try again.';
            messageDiv.classList.remove('success');
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        messageDiv.innerHTML = 'Sorry, there was an error sending your message. Please try again or email hello@dreamthewilderness.com directly.';
        messageDiv.classList.remove('success');
        messageDiv.classList.add('error');
    } finally {
        // Reset button
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
    }
}
