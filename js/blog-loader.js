/**
 * Dream the Wilderness - Blog Post Loader
 * Fetches and displays Substack RSS feed posts
 */

/**
 * Fetch Substack posts from the /api/blog endpoint with timeout
 */
async function loadSubstackPosts() {
    const blogContainer = document.getElementById('blog-posts');

    // Set timeout to clear skeleton loaders after 10 seconds
    const timeoutId = setTimeout(() => {
        const skeletonLoaders = blogContainer.querySelectorAll('.skeleton-loader');
        if (skeletonLoaders.length > 0) {
            console.warn('Blog loading timed out after 10 seconds');
            showBlogError('Blog posts are taking longer than expected. Please try refreshing the page.');
        }
    }, 10000);

    try {
        // Use your Cloudflare Worker endpoint with fetch timeout
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch('/api/blog', { signal: controller.signal });
        clearTimeout(fetchTimeout); // Clear fetch timeout on success

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        clearTimeout(timeoutId); // Clear loader timeout on success

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            displayBlogPosts(data.items.slice(0, 3)); // Show latest 3 posts
        } else {
            showBlogError('No posts found at this time');
        }
    } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('Error loading Substack posts:', error);

        // Provide more specific error messages
        if (error.name === 'AbortError') {
            showBlogError('Blog posts took too long to load. Please try again later.');
        } else {
            showBlogError('Unable to load posts at this time. Please check back later.');
        }
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
        const imageUrl = post.image || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=300&fit=crop&q=80';

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
