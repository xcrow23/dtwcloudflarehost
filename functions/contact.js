// functions/contact.js
// Cloudflare Pages Function for handling contact form submissions

export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://dreamthewilderness.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const service = formData.get('service') || 'General Inquiry';
    const message = formData.get('message');

    // Basic validation
    if (!name || !email || !message) {
      return jsonResponse({ 
        success: false, 
        error: 'Name, email, and message are required' 
      }, 400, corsHeaders);
    }

    // Email validation
    if (!isValidEmail(email)) {
      return jsonResponse({ 
        success: false, 
        error: 'Please provide a valid email address' 
      }, 400, corsHeaders);
    }

    // Spam protection
    if (containsSpam(message)) {
      return jsonResponse({ 
        success: false, 
        error: 'Message appears to be spam' 
      }, 400, corsHeaders);
    }

    // Prepare email content
    const emailContent = {
      to: env.CONTACT_EMAIL || 'hello@dreamthewilderness.com',
      from: env.FROM_EMAIL || 'noreply@dreamthewilderness.com',
      subject: `New Contact Form: ${service}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Service Interest:</strong> ${escapeHtml(service)}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><small>Sent from dreamthewilderness.com contact form</small></p>
      `
    };

    // Send email
    await sendEmail(emailContent, env);

    // Store in KV if available
    if (env.CONTACTS_KV) {
      const timestamp = new Date().toISOString();
      const contactId = `contact_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await env.CONTACTS_KV.put(contactId, JSON.stringify({
        name,
        email,
        service,
        message,
        timestamp,
        ip: request.headers.get('CF-Connecting-IP'),
        userAgent: request.headers.get('User-Agent')
      }));
    }

    return jsonResponse({ 
      success: true, 
      message: 'Thank you for your message! I\'ll get back to you soon.' 
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Sorry, there was an error sending your message. Please try again.' 
    }, 500, corsHeaders);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://dreamthewilderness.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Helper functions
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function containsSpam(text) {
  const spamKeywords = ['bitcoin', 'crypto', 'viagra', 'casino', 'lottery', 'million dollars'];
  const lowerText = text.toLowerCase();
  return spamKeywords.some(keyword => lowerText.includes(keyword));
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendEmail(emailContent, env) {
  // Using Resend API for sending emails
  if (env.RESEND_API_KEY) {
    const emailData = {
      from: emailContent.from,
      to: [emailContent.to],
      subject: emailContent.subject,
      html: emailContent.html
    };

    // Add reply-to if specified
    if (emailContent.replyTo) {
      emailData.reply_to = emailContent.replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);
    
  } else {
    // Log when API key is missing
    console.log('Email would be sent:', emailContent);
    console.log('Note: Set RESEND_API_KEY environment variable to actually send emails');
    
    // Throw error to prevent silent failures
    throw new Error('Email service not configured - missing RESEND_API_KEY');
  }
}