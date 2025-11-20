/**
 * Dream the Wilderness - Blog Post Loader
 * Fetches and displays Substack RSS feed posts
 */

/**
 * Fetch Substack posts from the /api/blog endpoint
 */
async function loadSubstackPosts() {
    try {
        // Use your Cloudflare Worker endpoint
        const response = await fetch('/api/blog');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            displayBlogPosts(data.items.slice(0, 3)); // Show latest 3 posts
        } else {
            showBlogError('No posts found at this time');
        }
    } catch (error) {
        console.error('Error loading Substack posts:', error);
        showBlogError('Unable to load posts at this time');
    }
}

/**
 * Display blog posts in the DOM
 * @param {Array} posts - Array of post objects from the API
 */
function displayBlogPosts(posts) {
    const blogContainer = document.getElementById('blog-posts');

    blogContainer.innerHTML = posts.map(post => {
        // Format date
        const date = new Date(post.pubDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Use featured image if available, otherwise use placeholder
        const imageUrl = post.image || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop';

        // Prepare description - use as-is since it's already cleaned by API
        const description = post.description || 'Read more on Substack...';

        return `
            <div class="service-card blog-post">
                <img src="${imageUrl}" alt="${escapeHtml(post.title)}" loading="lazy" class="blog-post-image">
                <h3 class="blog-post-title">${escapeHtml(post.title)}</h3>
                <p class="blog-post-date">${date}</p>
                <p class="blog-post-excerpt">${escapeHtml(description)}</p>
                <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="btn">Read Full Post</a>
            </div>
        `;
    }).join('');
}

/**
 * Show an error message when blog posts fail to load
 * @param {string} message - Error message to display
 */
function showBlogError(message) {
    const blogContainer = document.getElementById('blog-posts');
    blogContainer.innerHTML = `
        <div class="service-card content-card">
            <h3>Wilderness Journal</h3>
            <p>${message}</p>
            <p style="margin-top: 1rem;">Visit the full blog for the latest reflections and insights.</p>
            <a href="https://dreamthewilderness.substack.com" target="_blank" rel="noopener noreferrer" class="btn">Visit Substack</a>
        </div>
    `;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
