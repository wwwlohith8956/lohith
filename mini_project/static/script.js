/**
 * REST API Studio - JavaScript Driver
 * Explict representation of GET, POST, PUT, PATCH, and DELETE API calls
 */

// Helper to inspect HTTP Response
async function handleResponse(method, url, startTime, response) {
    const duration = Math.round(performance.now() - startTime);
    const status = response.status;
    const statusText = response.statusText;

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = { message: "No JSON payload returned (Empty body)" };
    }

    // Update Status Badge
    const badge = document.getElementById('response-status-badge');
    badge.textContent = `${status} ${statusText}`;
    badge.className = `status-badge status-${status}`;

    // Update Meta & Timing
    document.getElementById('response-url').textContent = `${method} ${url}`;
    document.getElementById('response-timer').textContent = `${duration} ms`;

    // Pretty Print JSON
    document.getElementById('json-output').textContent = JSON.stringify(data, null, 2);

    // Refresh db list on successful mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && status >= 200 && status < 300) {
        executeGetAll(false);
    }
}

// 🔵 1. GET ALL PRODUCTS
async function executeGetAll(inspect = true) {
    const url = '/api/products/';
    const startTime = performance.now();

    try {
        const response = await fetch(url, { method: 'GET' });
        if (inspect) {
            await handleResponse('GET', url, startTime, response);
        } else {
            const data = await response.json();
            renderInventory(data.data || []);
            return;
        }
        
        // Also update inventory list
        const resClone = await fetch(url);
        const data = await resClone.json();
        renderInventory(data.data || []);
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// 🔵 2. GET SINGLE PRODUCT
async function executeGetSingle() {
    const id = document.getElementById('get-id').value;
    if (!id) return alert("Please enter a Product ID");

    const url = `/api/products/${id}/`;
    const startTime = performance.now();

    try {
        const response = await fetch(url, { method: 'GET' });
        await handleResponse('GET', url, startTime, response);
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// 🟢 3. POST (CREATE PRODUCT)
async function executePost() {
    const name = document.getElementById('post-name').value;
    const price = parseInt(document.getElementById('post-price').value) || 0;
    const description = document.getElementById('post-desc').value || "Default description";

    if (!name) return alert("Please provide a Product Name");

    const url = '/api/products/';
    const startTime = performance.now();
    const payload = { name, price, description };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await handleResponse('POST', url, startTime, response);

        // Clear input fields
        document.getElementById('post-name').value = '';
        document.getElementById('post-price').value = '';
        document.getElementById('post-desc').value = '';
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// 🟡 4. PUT (FULL UPDATE)
async function executePut() {
    const id = document.getElementById('put-id').value;
    const name = document.getElementById('put-name').value;
    const price = parseInt(document.getElementById('put-price').value);
    const description = document.getElementById('put-desc').value;

    if (!id) return alert("Please specify Product ID to update");
    if (!name || isNaN(price) || description === "") {
        return alert("PUT requires ALL fields: Name, Price, and Description.");
    }

    const url = `/api/products/${id}/`;
    const startTime = performance.now();
    const payload = { name, price, description };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await handleResponse('PUT', url, startTime, response);
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// 🟣 5. PATCH (PARTIAL UPDATE)
async function executePatch() {
    const id = document.getElementById('patch-id').value;
    if (!id) return alert("Please specify Product ID to patch");

    const name = document.getElementById('patch-name').value;
    const priceRaw = document.getElementById('patch-price').value;
    const description = document.getElementById('patch-desc').value;

    // Build object with only defined fields
    const payload = {};
    if (name) payload.name = name;
    if (priceRaw !== '') payload.price = parseInt(priceRaw);
    if (description) payload.description = description;

    if (Object.keys(payload).length === 0) {
        return alert("Provide at least one field to update with PATCH");
    }

    const url = `/api/products/${id}/`;
    const startTime = performance.now();

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await handleResponse('PATCH', url, startTime, response);
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// 🔴 6. DELETE
async function executeDelete() {
    const id = document.getElementById('delete-id').value;
    if (!id) return alert("Please enter Product ID to delete");

    const url = `/api/products/${id}/`;
    const startTime = performance.now();

    try {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        await handleResponse('DELETE', url, startTime, response);
    } catch (error) {
        document.getElementById('json-output').textContent = JSON.stringify({ error: error.message }, null, 2);
    }
}

// Render Database Inventory Cards
function renderInventory(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p class="card-desc">No products found in DB. Use POST to add some!</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-item';
        card.innerHTML = `
            <span class="prod-id">ID: #${p.id}</span>
            <div class="prod-name">${escapeHtml(p.name)}</div>
            <div class="prod-price">₹${p.price}</div>
            <div class="prod-desc">${escapeHtml(p.description || '')}</div>
            <div class="prod-actions">
                <button class="btn-xs btn-put" onclick="fillForm(${p.id}, '${escapeHtml(p.name)}', ${p.price}, '${escapeHtml(p.description || '')}')">Fill PUT/PATCH</button>
                <button class="btn-xs btn-delete" onclick="quickDelete(${p.id})">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function fillForm(id, name, price, desc) {
    // Fill GET
    document.getElementById('get-id').value = id;

    // Fill PUT
    document.getElementById('put-id').value = id;
    document.getElementById('put-name').value = name;
    document.getElementById('put-price').value = price;
    document.getElementById('put-desc').value = desc;

    // Fill PATCH
    document.getElementById('patch-id').value = id;
    document.getElementById('patch-name').value = name;
    document.getElementById('patch-price').value = price;
    document.getElementById('patch-desc').value = desc;

    // Fill DELETE
    document.getElementById('delete-id').value = id;
}

function quickDelete(id) {
    document.getElementById('delete-id').value = id;
    executeDelete();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initial Load
executeGetAll(false);