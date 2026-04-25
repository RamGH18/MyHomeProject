let vendors = [];
let projects = [];
let userRequests = []; // Track user's joined projects
let inboxMessages = []; // Track simulated messages
let chatHistory = {}; // Format: { "Vendor Name": [ {from: 'user', text: '...'}, {from: 'vendor', text: '...'} ] }
let map = null;

// Load Mock Data
async function loadData() {
    try {
        const vRes = await fetch('vendors.json');
        if (!vRes.ok) throw new Error('Failed to load vendors.json');
        vendors = await vRes.json();
        
        const pRes = await fetch('projects.json');
        if (!pRes.ok) throw new Error('Failed to load projects.json');
        projects = await pRes.json();

        console.log('Data loaded successfully:', vendors.length, 'vendors found.');
        populateCategories();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading vendor data. Please ensure you are running a local server.');
    }
}

function populateCategories() {
    const categorySelect = document.getElementById('categorySearch');
    const uniqueCategories = [...new Set(vendors.map(v => v.category))].sort();
    
    uniqueCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('resultsSection');
    const myProjectsSection = document.getElementById('myProjectsSection');
    const inboxSection = document.getElementById('inboxSection');
    const mapSection = document.getElementById('mapSection');
    const conversationSection = document.getElementById('conversationSection');
    const searchTab = document.getElementById('searchTab');
    const mapTab = document.getElementById('mapTab');
    const projectsTab = document.getElementById('projectsTab');
    const inboxTab = document.getElementById('inboxTab');

    // Tab Switching
    searchTab.addEventListener('click', () => { setActiveTab(searchTab); showSection('search'); });
    mapTab.addEventListener('click', () => { setActiveTab(mapTab); showSection('map'); initMap(); });
    projectsTab.addEventListener('click', () => { setActiveTab(projectsTab); showSection('projects'); renderMyProjects(); });
    inboxTab.addEventListener('click', () => { setActiveTab(inboxTab); showSection('inbox'); renderInbox(); });

    document.getElementById('backToInbox').onclick = () => showSection('inbox');

    function setActiveTab(tab) {
        [searchTab, mapTab, projectsTab, inboxTab].forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    function showSection(type) {
        [document.querySelector('.search-container'), resultsSection, myProjectsSection, inboxSection, conversationSection, mapSection].forEach(s => s.classList.add('hidden'));
        
        if (type === 'search') {
            document.querySelector('.search-container').classList.remove('hidden');
            resultsSection.classList.remove('hidden');
        } else if (type === 'projects') {
            myProjectsSection.classList.remove('hidden');
        } else if (type === 'inbox') {
            inboxSection.classList.remove('hidden');
        } else if (type === 'conversation') {
            conversationSection.classList.remove('hidden');
        } else if (type === 'map') {
            mapSection.classList.remove('hidden');
        }
    }

    searchBtn.addEventListener('click', () => {
        const category = document.getElementById('categorySearch').value;
        const zipcode = document.getElementById('zipSearch').value.trim();

        if (!category || !zipcode) {
            alert('Please select a service and enter a zip code');
            return;
        }

        const filteredVendors = vendors.filter(v => 
            (v.category.toLowerCase().includes(category.toLowerCase()) || 
             v.name.toLowerCase().includes(category.toLowerCase())) && 
            v.zipcodes.includes(zipcode)
        );

        renderResults(filteredVendors, zipcode);
        showSection('search');
        resultsSection.classList.remove('hidden');
    });

    document.getElementById('sendChatBtn').onclick = () => sendMessage();
    document.getElementById('chatInput').onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };
});

function initMap() {
    if (map) return;
    map = L.map('map').setView([37.422, -122.084], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    vendors.forEach(v => {
        if (v.lat && v.lng) {
            L.marker([v.lat, v.lng]).addTo(map).bindPopup(`<b>${v.name}</b><br>${v.category}<br><button class="ios-btn-small" onclick="viewDetails(${v.id}, '94043')">View Deals</button>`);
        }
    });

    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    projects.forEach(p => {
        const vendor = vendors.find(v => v.id === p.vendorId);
        if (p.lat && p.lng) {
            L.marker([p.lat, p.lng], {icon: greenIcon}).addTo(map)
                .bindPopup(`<b>${p.neighborName}'s House</b><br>Active: ${vendor.name}<br><button class="ios-btn-small" onclick="viewDetails(${vendor.id}, '${p.zipcode}')">Join Project</button>`);
        }
    });
}

function renderResults(filteredVendors, zipcode) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    filteredVendors.forEach(vendor => {
        const activeProject = projects.find(p => p.vendorId === vendor.id && p.zipcode === zipcode);
        const gb = vendor.groupBuy;
        const maxTiers = Math.max(...gb.tiers.map(t => t.count));
        const progressPercent = Math.min((gb.current / maxTiers) * 100, 100);
        const currentDiscount = [...gb.tiers].reverse().find(t => gb.current >= t.count)?.discount || 0;

        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'flex-start';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <div class="vendor-info">
                    <h3>${vendor.name}</h3>
                    <p>${vendor.category} • ★ ${vendor.rating}</p>
                </div>
                <button class="ios-btn-small" onclick="viewDetails(${vendor.id}, '${zipcode}')">View</button>
            </div>
            
            ${activeProject ? `<div class="badge" style="margin-top:8px;">Working at ${activeProject.neighborName}'s</div>` : ''}
            
            <div class="mini-gb-container">
                <div class="mini-progress-track">
                    <div class="mini-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="mini-gb-text">🔥 ${currentDiscount}% OFF Deal • ${gb.current} neighbors joined</div>
            </div>
        `;
        resultsList.appendChild(card);
    });
}

let currentVendor = null;
let currentZip = null;

function viewDetails(vendorId, zipcode) {
    const vendor = vendors.find(v => v.id === vendorId);
    const activeProject = projects.find(p => p.vendorId === vendorId && p.zipcode === zipcode);
    currentVendor = vendor;
    currentZip = zipcode;

    const modal = document.getElementById('detailModal');
    const modalHeader = document.getElementById('modalHeader');
    const modalBody = document.getElementById('modalBody');
    const requestForm = document.getElementById('requestForm');

    // Reset visibility
    requestForm.classList.add('hidden');
    modalBody.classList.remove('hidden');
    
    modalHeader.innerHTML = `<h2 style="margin-top:0">${vendor.name}</h2>`;
    
    // Calculate Group Buy Progress
    const gb = vendor.groupBuy;
    const maxTiers = Math.max(...gb.tiers.map(t => t.count));
    const progressPercent = Math.min((gb.current / maxTiers) * 100, 100);
    
    const nextTier = gb.tiers.find(t => t.count > gb.current) || gb.tiers[gb.tiers.length-1];
    const currentDiscount = [...gb.tiers].reverse().find(t => gb.current >= t.count)?.discount || 0;

    modalBody.innerHTML = `
        <p><strong>Category:</strong> ${vendor.category}</p>
        
        <div class="group-buy-container">
            <h4 style="margin:0; color:var(--ios-blue);">Neighborhood Group Deal</h4>
            <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:13px;">
                <span>Current: <strong>${currentDiscount}% OFF</strong></span>
                <span>Neighbors: <strong>${gb.current}</strong></span>
            </div>
            
            <div class="progress-track">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                ${gb.tiers.map(t => `
                    <div class="tier-marker" style="left: ${(t.count/maxTiers)*100}%"></div>
                    <div class="tier-label" style="left: ${(t.count/maxTiers)*100}%">${t.discount}%</div>
                `).join('')}
            </div>
            
            <p style="font-size:12px; color:var(--ios-gray); margin-top:20px; text-align:center;">
                ${gb.current < maxTiers ? `Only <strong>${nextTier.count - gb.current} more</strong> neighbor(s) needed for ${nextTier.discount}% OFF!` : 'MAX DISCOUNT ACHIEVED!'}
            </p>
            
            <button class="share-btn" onclick="shareDeal('${vendor.name}', ${currentDiscount})">Share with Neighbors</button>
        </div>

        <hr>
        ${activeProject ? `
            <div class="neighbor-alert">
                <h4 style="margin:0; color:#2e7d32;">Neighbor Opportunity!</h4>
                <p style="font-size:14px;">${activeProject.neighborName} is doing: <em>"${activeProject.description}"</em></p>
                <button class="ios-btn" style="width:100%; margin-top:10px;" onclick="showRequestForm()">Join Project & Get Deal</button>
            </div>
        ` : `
            <button class="ios-btn" style="width:100%;" onclick="showRequestForm()">Request a Quote</button>
        `}
    `;
    modal.classList.remove('hidden');
}

function shareDeal(vendorName, discount) {
    const text = `Hey neighbors! I'm using HomeGroup to get a deal on ${vendorName}. We currently have a ${discount}% neighborhood discount. Join in so we can hit the next tier!`;
    if (navigator.share) {
        navigator.share({ title: 'HomeGroup Deal', text: text, url: window.location.href });
    } else {
        alert("Simulated Share Sheet:\n\n" + text);
    }
}

function showRequestForm() {
    document.getElementById('modalBody').classList.add('hidden');
    document.getElementById('requestForm').classList.remove('hidden');
}

document.getElementById('submitRequestBtn').onclick = () => {
    const requirement = document.getElementById('userRequirement').value;
    if (!requirement) { alert('Please describe what you need.'); return; }

    const newRequest = {
        id: Date.now(), vendorName: currentVendor.name, category: currentVendor.category,
        zipcode: currentZip, requirement: requirement, status: 'Pending Review', date: new Date().toLocaleDateString()
    };

    userRequests.push(newRequest);
    
    // Simulate updating the count
    currentVendor.groupBuy.current += 1;

    chatHistory[currentVendor.name] = [{ from: 'user', text: `Hi! I joined the group project for: ${requirement}.`, date: new Date().toLocaleTimeString() }];
    alert(`Success! You've joined the neighborhood group. You helped everyone get closer to the next discount tier!`);
    document.getElementById('detailModal').classList.add('hidden');
    simulateVendorResponse(newRequest);
};

function simulateVendorResponse(request) {
    setTimeout(() => {
        const vendorReplyText = `Thanks for joining the group! I'll be in your neighborhood tomorrow. I've applied the current neighborhood discount to your quote.`;
        inboxMessages.unshift({
            id: Date.now(), from: request.vendorName, subject: `Group Deal Applied`, body: vendorReplyText,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        chatHistory[request.vendorName].push({ from: 'vendor', text: vendorReplyText, date: new Date().toLocaleTimeString() });
        const req = userRequests.find(r => r.id === request.id);
        if (req) req.status = 'Deal Received';
        document.getElementById('inboxTab').innerHTML = 'Inbox <span style="color:red; font-weight:bold;">(1)</span>';
    }, 5000);
}

function renderInbox() {
    const list = document.getElementById('inboxList');
    document.getElementById('inboxTab').innerHTML = 'Inbox';
    list.innerHTML = '';
    if (inboxMessages.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:40px; color:var(--ios-gray);">Your inbox is empty.</p>';
        return;
    }
    inboxMessages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.style.flexDirection = 'column'; card.style.alignItems = 'flex-start';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%;">
                <h3 style="font-size:16px;">${msg.from}</h3>
                <span style="font-size:12px; color:var(--ios-gray);">${msg.date}</span>
            </div>
            <p style="margin: 5px 0; font-weight:600; font-size:14px;">${msg.subject}</p>
            <p style="margin: 0; font-size:14px; color:#444;">${msg.body}</p>
            <div style="display:flex; gap:10px; width:100%; margin-top:15px;">
                <button class="ios-btn" style="flex:1; padding:10px; font-size:13px;" onclick="confirmAccept('${msg.from}')">Accept Deal</button>
                <button class="ios-btn" style="flex:1; padding:10px; font-size:13px; background:#8E8E93;" onclick="openChat('${msg.from}')">Respond</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function openChat(vendorName) {
    currentVendorChat = vendorName;
    document.getElementById('chatVendorName').textContent = vendorName;
    renderChatHistory();
    document.getElementById('inboxSection').classList.add('hidden');
    document.getElementById('conversationSection').classList.remove('hidden');
}

let currentVendorChat = '';

function renderChatHistory() {
    const container = document.getElementById('chatHistory');
    container.innerHTML = '';
    const messages = chatHistory[currentVendorChat] || [];
    messages.forEach(m => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${m.from}`;
        bubble.innerHTML = `${m.text}<div style="font-size:10px; opacity:0.7; margin-top:5px;">${m.date}</div>`;
        container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    chatHistory[currentVendorChat].push({ from: 'user', text: text, date: new Date().toLocaleTimeString() });
    input.value = '';
    renderChatHistory();
    setTimeout(() => {
        chatHistory[currentVendorChat].push({ from: 'vendor', text: "Got it! Let me check my schedule.", date: new Date().toLocaleTimeString() });
        renderChatHistory();
    }, 2000);
}

function confirmAccept(vendorName) {
    const req = userRequests.find(r => r.vendorName === vendorName);
    if (req) req.status = 'Scheduled';
    alert(`Success! Opening Google Calendar...`);
    setTimeout(() => { inboxMessages = inboxMessages.filter(m => m.from !== vendorName); renderInbox(); }, 1000);
}

function renderMyProjects() {
    const list = document.getElementById('myProjectsList');
    list.innerHTML = '';
    userRequests.forEach(req => {
        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.style.flexDirection = 'column'; card.style.alignItems = 'flex-start';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%;">
                <h3 style="color:var(--ios-blue)">${req.vendorName}</h3>
                <span class="badge" style="background:${req.status === 'Deal Received' ? 'var(--ios-green)' : 'var(--ios-blue)'}">${req.status}</span>
            </div>
            <p style="margin: 5px 0; font-size:14px;">"${req.requirement}"</p>
            <button class="ios-btn-small" style="margin-top:10px;" onclick="openChat('${req.vendorName}')">View Chat History</button>
        `;
        list.appendChild(card);
    });
}
document.querySelector('.close-btn').onclick = () => { document.getElementById('detailModal').classList.add('hidden'); };
