let vendors = [];
let projects = [];
let userRequests = []; // Track user's joined projects
let inboxMessages = []; // Track simulated messages
let chatHistory = {}; // Format: { "Vendor Name": [ {from: 'user', text: '...'}, {from: 'vendor', text: '...'} ] }

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
    const conversationSection = document.getElementById('conversationSection');
    const searchTab = document.getElementById('searchTab');
    const projectsTab = document.getElementById('projectsTab');
    const inboxTab = document.getElementById('inboxTab');

    // Tab Switching
    searchTab.addEventListener('click', () => { setActiveTab(searchTab); showSection('search'); });
    projectsTab.addEventListener('click', () => { setActiveTab(projectsTab); showSection('projects'); renderMyProjects(); });
    inboxTab.addEventListener('click', () => { setActiveTab(inboxTab); showSection('inbox'); renderInbox(); });

    document.getElementById('backToInbox').onclick = () => showSection('inbox');

    function setActiveTab(tab) {
        [searchTab, projectsTab, inboxTab].forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    function showSection(type) {
        [document.querySelector('.search-container'), resultsSection, myProjectsSection, inboxSection, conversationSection].forEach(s => s.classList.add('hidden'));
        
        if (type === 'search') {
            document.querySelector('.search-container').classList.remove('hidden');
            resultsSection.classList.remove('hidden');
        } else if (type === 'projects') {
            myProjectsSection.classList.remove('hidden');
        } else if (type === 'inbox') {
            inboxSection.classList.remove('hidden');
        } else if (type === 'conversation') {
            conversationSection.classList.remove('hidden');
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
        resultsSection.classList.remove('hidden');
    });

    document.getElementById('sendChatBtn').onclick = () => sendMessage();
    document.getElementById('chatInput').onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };
});

function renderResults(filteredVendors, zipcode) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';

    filteredVendors.forEach(vendor => {
        const activeProject = projects.find(p => p.vendorId === vendor.id && p.zipcode === zipcode);
        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.innerHTML = `
            <div class="vendor-info">
                <h3>${vendor.name}</h3>
                <p>${vendor.category} • ★ ${vendor.rating}</p>
                ${activeProject ? `<div class="badge">Working at ${activeProject.neighborName}'s</div>` : ''}
            </div>
            <button class="ios-btn-small" onclick="viewDetails(${vendor.id}, '${zipcode}')">View</button>
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

    requestForm.classList.add('hidden');
    modalHeader.innerHTML = `<h2 style="margin-top:0">${vendor.name}</h2>`;
    modalBody.innerHTML = `
        <p><strong>Category:</strong> ${vendor.category}</p>
        <p><strong>Rating:</strong> ★ ${vendor.rating}</p>
        <hr>
        ${activeProject ? `
            <div class="neighbor-alert">
                <h4 style="margin:0; color:#2e7d32;">Neighbor Opportunity!</h4>
                <p style="font-size:14px;">${activeProject.neighborName} is doing: <em>"${activeProject.description}"</em></p>
                <button class="ios-btn" style="width:100%; margin-top:10px;" onclick="showRequestForm()">Join Project & Get Neighbor Deal</button>
            </div>
        ` : `
            <button class="ios-btn" style="width:100%;" onclick="showRequestForm()">Request a Quote</button>
        `}
    `;
    modal.classList.remove('hidden');
}

function showRequestForm() {
    document.getElementById('modalBody').classList.add('hidden');
    document.getElementById('requestForm').classList.remove('hidden');
}

document.getElementById('submitRequestBtn').onclick = () => {
    const requirement = document.getElementById('userRequirement').value;
    if (!requirement) {
        alert('Please describe what you need.');
        return;
    }

    const newRequest = {
        id: Date.now(),
        vendorName: currentVendor.name,
        category: currentVendor.category,
        zipcode: currentZip,
        requirement: requirement,
        status: 'Pending Vendor Review',
        date: new Date().toLocaleDateString()
    };

    userRequests.push(newRequest);
    
    // Initialize Chat History with user's initial request
    chatHistory[currentVendor.name] = [{ from: 'user', text: `Hi! I need help with: ${requirement}. I see you are working at my neighbor's house!`, date: new Date().toLocaleTimeString() }];

    alert(`Success! Your request has been sent to ${currentVendor.name}.`);
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('userRequirement').value = '';

    simulateVendorResponse(newRequest);
};

function simulateVendorResponse(request) {
    setTimeout(() => {
        const vendorReplyText = `Hi! I saw your request. Since I'm already at your neighbor's house, I can offer you a 15% discount if we schedule it for tomorrow!`;
        
        inboxMessages.unshift({
            id: Date.now(),
            from: request.vendorName,
            subject: `Neighbor Deal Received`,
            body: vendorReplyText,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        
        // Add to chat history
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
        const eventTitle = encodeURIComponent(`${msg.from} Service - HomeGroup Deal`);
        const eventDetails = encodeURIComponent(`Neighbor discount confirmed for: ${msg.subject}`);
        const eventLocation = encodeURIComponent(`My Home`);
        const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
        const end = new Date(start); end.setHours(11, 0, 0, 0);
        const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatDate(start)}/${formatDate(end)}&details=${eventDetails}&location=${eventLocation}`;

        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'flex-start';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%;">
                <h3 style="font-size:16px;">${msg.from}</h3>
                <span style="font-size:12px; color:var(--ios-gray);">${msg.date}</span>
            </div>
            <p style="margin: 5px 0; font-weight:600; font-size:14px;">${msg.subject}</p>
            <p style="margin: 0; font-size:14px; color:#444;">${msg.body}</p>
            <div style="display:flex; gap:10px; width:100%; margin-top:15px;">
                <a href="${calendarUrl}" target="_blank" class="ios-btn" style="flex:1; padding:10px; font-size:13px; text-decoration:none; text-align:center;" onclick="confirmAccept('${msg.from}')">Accept Deal</a>
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
    // Hide Inbox and show Conversation
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

    // Sim response
    setTimeout(() => {
        chatHistory[currentVendorChat].push({ from: 'vendor', text: "Got it! Let me check my schedule and get back to you.", date: new Date().toLocaleTimeString() });
        renderChatHistory();
    }, 2000);
}

function confirmAccept(vendorName) {
    const req = userRequests.find(r => r.vendorName === vendorName);
    if (req) req.status = 'Scheduled';
    alert(`Success! Updated to 'Scheduled'. Opening Google Calendar...`);
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
// Modal Close logic
document.querySelector('.close-btn').onclick = () => {
    document.getElementById('detailModal').classList.add('hidden');
};
