/**
 * Dream the Wilderness - Contact Form Handler
 * Manages contact form submission and response handling
 */

/**
 * Handle contact form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

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

        const result = await response.json();

        if (result.success) {
            // Success message
            messageDiv.innerHTML = result.message;
            messageDiv.classList.remove('error');
            messageDiv.classList.add('success');

            // Reset form
            form.reset();
        } else {
            // Error message
            messageDiv.innerHTML = result.error;
            messageDiv.classList.remove('success');
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        messageDiv.innerHTML = 'Sorry, there was an error sending your message. Please try again or email directly.';
        messageDiv.classList.remove('success');
        messageDiv.classList.add('error');
    } finally {
        // Reset button
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
    }
}
