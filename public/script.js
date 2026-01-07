const tg = window.Telegram.WebApp;
tg.expand();

const searchInput = document.getElementById('searchInput');
const linkList = document.getElementById('linkList');
const loading = document.getElementById('loading');

let timeout = null;
let currentStatus = 'all';

async function fetchLinks(query = '') {
    loading.style.display = 'block';
    linkList.innerHTML = '';

    try {
        const res = await fetch(`/api/links?search=${encodeURIComponent(query)}&status=${currentStatus}`);
        const links = await res.json();

        loading.style.display = 'none';
        renderLinks(links);
    } catch (error) {
        loading.innerText = 'Error loading links.';
        console.error(error);
    }
}

function renderLinks(links) {
    if (links.length === 0) {
        linkList.innerHTML = '<div style="text-align:center; color: var(--hint-color)">No links found.</div>';
        return;
    }

    links.forEach(link => {
        const card = document.createElement('div');
        card.className = `link-card ${link.is_read ? 'read' : ''}`;

        const tagsHtml = link.Tags ? link.Tags.map(tag => `<span class="tag">#${tag.name}</span>`).join('') : '';
        const readBtnText = link.is_read ? 'Mark Unread' : 'Mark Read';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start">
                <a href="${link.url}" class="link-title" target="_blank">${link.title}</a>
                <div style="display:flex; gap:8px;">
                    <button class="read-toggle" onclick="toggleRead(${link.id})">${readBtnText}</button>
                    <button class="delete-btn" onclick="deleteLink(${link.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="link-summary">${link.summary || 'No summary available'}</div>
            <div class="tags">${tagsHtml}</div>
        `;

        linkList.appendChild(card);
    });
}

async function toggleRead(id) {
    try {
        await fetch(`/api/links/${id}/toggle-read`, { method: 'PATCH' });
        fetchLinks(searchInput.value);
    } catch (e) {
        console.error(e);
        alert('Error updating status');
    }
}

async function deleteLink(id) {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
        await fetch(`/api/links/${id}`, { method: 'DELETE' });
        fetchLinks(searchInput.value);
    } catch (e) {
        console.error(e);
        alert('Error deleting link');
    }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentStatus = e.target.dataset.status;
        fetchLinks(searchInput.value);
    });
});

// Initial Load
fetchLinks();

// Search with Debounce
searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        fetchLinks(e.target.value);
    }, 500);
});
