document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const orderIdInput = document.getElementById('order-id-input');
    const fetchOrderBtn = document.getElementById('fetch-order-btn');
    const loader = document.getElementById('loader');
    const errorBox = document.getElementById('error-box');
    const orderDetailsContainer = document.getElementById('order-details-container');
    
    // --- State Variables ---
    const API_PROXY_URL = 'https://square-checkin-backend.onrender.com';

    // --- UI Helper Functions ---
    const showLoader = (message) => {
        loader.querySelector('p').textContent = message || 'Processing...';
        loader.style.display = 'flex';
        errorBox.style.display = 'none';
        orderDetailsContainer.style.display = 'none';
    };
    const hideLoader = () => {
        loader.style.display = 'none';
    };
    const showError = (message) => {
        errorBox.textContent = `Error: ${message}`;
        errorBox.style.display = 'block';
        hideLoader();
        orderDetailsContainer.style.display = 'none';
    };
    
    // --- API Fetch Function ---
    const apiFetch = async (endpoint, options = {}) => {
        const response = await fetch(`${API_PROXY_URL}/api${endpoint}`, {
            ...options,
            headers: { ...options.headers, 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.errors?.[0]?.detail || data.error || 'An API error occurred.');
        return data;
    };

    // --- Core Application Logic ---
    const fetchOrderDetails = async () => {
        const orderId = orderIdInput.value.trim();
        if (!orderId) {
            showError("Please enter a valid Order ID.");
            return;
        }

        showLoader('Fetching order details...');

        try {
            // Use the RetrieveOrder endpoint for a specific order
            const data = await apiFetch(`/v2/orders/${orderId}`);
            
            if (data.order) {
                displayOrder(data.order);
            } else {
                showError("No order found with that ID.");
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            showError(`Failed to fetch order details: ${error.message}`);
        } finally {
            hideLoader();
        }
    };
    
    const displayOrder = (order) => {
        let html = `<h2 class="text-2xl font-bold mb-4">Order Summary</h2>`;
        html += `<p class="mb-2"><strong class="text-gray-700">Order ID:</strong> ${order.id}</p>`;
        html += `<p class="mb-2"><strong class="text-gray-700">Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>`;
        
        if (order.line_items && order.line_items.length > 0) {
            html += `<h3 class="text-xl font-semibold mt-4 mb-2">Line Items:</h3>`;
            html += `<ul class="list-disc list-inside space-y-2">`;
            order.line_items.forEach(item => {
                html += `<li><strong class="text-gray-700">${item.name}</strong> (${item.quantity} units)</li>`;
            });
            html += `</ul>`;
        }
        
        if (order.tenders && order.tenders.length > 0) {
            html += `<h3 class="text-xl font-semibold mt-4 mb-2">Payments:</h3>`;
            html += `<ul class="list-disc list-inside space-y-2">`;
            order.tenders.forEach(tender => {
                const amount = tender.amount_money.amount / 100; // Amount is in cents
                const currency = tender.amount_money.currency;
                html += `<li>${tender.type}: ${amount.toFixed(2)} ${currency}</li>`;
            });
            html += `</ul>`;
        }
        
        orderDetailsContainer.innerHTML = html;
        orderDetailsContainer.style.display = 'block';
    };

    // --- Event Listeners ---
    fetchOrderBtn.addEventListener('click', fetchOrderDetails);
    orderIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchOrderBtn.click();
        }
    });
});
