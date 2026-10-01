// Initialize visitors array from localStorage or empty
let visitors = JSON.parse(localStorage.getItem('ctrlMuseVisitors')) || [];

// DOM Elements
const visitorForm = document.getElementById('visitorForm');
const nameInput = document.getElementById('name');
const wingInput = document.getElementById('wing');
const flatInput = document.getElementById('flat');
const phoneInput = document.getElementById('phone');
const formError = document.getElementById('formError');
const insideList = document.getElementById('insideList');
const historyList = document.getElementById('historyList');
const insideCount = document.getElementById('insideCount');
const searchFlat = document.getElementById('searchFlat');

// Save to localStorage
function saveVisitors() {
  localStorage.setItem('ctrlMuseVisitors', JSON.stringify(visitors));
}

// Generate timestamp
function getTimestamp() {
  const now = new Date();
  const date = now.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  const time = now.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  return `${date} ${time}`;
}

// Validate phone (10 or 12 digits)
function isValidPhone(phone) {
  const regex = /^(\d{10}|\d{12})$/;
  return regex.test(phone);
}

// Add visitor
visitorForm.addEventListener('submit', function(e) {
  e.preventDefault();
  formError.textContent = '';

  const name = nameInput.value.trim();
  const wing = wingInput.value;
  const flat = parseInt(flatInput.value);
  const phone = phoneInput.value.trim();

  // Validation
  if (!name) {
    formError.textContent = 'Please enter visitor name';
    return;
  }
  if (!wing || (wing !== 'A' && wing !== 'B')) {
    formError.textContent = 'Select wing A or B';
    return;
  }
  if (isNaN(flat) || flat < 1 || flat > 40) {
    formError.textContent = 'Flat must be between 1 and 40';
    return;
  }
  if (!isValidPhone(phone)) {
    formError.textContent = 'Phone must be exactly 10 or 12 digits';
    return;
  }

  // Create visitor object
  const newVisitor = {
    id: Date.now(),
    name: name,
    wing: wing,
    flat: flat,
    phone: phone,
    entryTime: getTimestamp(),
    exitTime: null,
    status: 'inside'
  };

  visitors.push(newVisitor);
  saveVisitors();
  renderVisitors();
  
  // Reset form
  visitorForm.reset();
});

// Mark exit
function markExit(id) {
  const visitor = visitors.find(v => v.id === id);
  if (visitor && visitor.status === 'inside') {
    visitor.exitTime = getTimestamp();
    visitor.status = 'exited';
    saveVisitors();
    renderVisitors();
  }
}

// Render visitors
function renderVisitors() {
  const searchTerm = searchFlat.value.trim().toUpperCase();
  
  // Filter inside visitors
  let insideVisitors = visitors.filter(v => v.status === 'inside');
  
  // Apply search filter
  if (searchTerm) {
    insideVisitors = insideVisitors.filter(v => {
      const flatStr = `${v.wing}${v.flat}`.toUpperCase();
      return flatStr.includes(searchTerm);
    });
  }

  // Update counter
  insideCount.textContent = insideVisitors.length;

  // Render inside list
  if (insideVisitors.length === 0) {
    insideList.innerHTML = '<p class="empty-state">No visitors currently inside</p>';
  } else {
    insideList.innerHTML = insideVisitors.map(v => `
      <div class="visitor-card">
        <div class="visitor-info">
          <h3>${v.name}</h3>
          <p><strong>Flat:</strong> ${v.wing}-${v.flat}</p>
          <p><strong>Phone:</strong> ${v.phone}</p>
          <p class="time">Entered: ${v.entryTime}</p>
        </div>
        <button class="btn-exit" onclick="markExit(${v.id})">Mark Exit</button>
      </div>
    `).join('');
  }

  // Render history (today's exited visitors)
  const today = new Date().toLocaleDateString('en-IN');
  const historyVisitors = visitors.filter(v => {
    if (v.status !== 'exited') return false;
    return v.exitTime.includes(today);
  }).reverse();

  if (historyVisitors.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No visitor history yet</p>';
  } else {
    historyList.innerHTML = historyVisitors.map(v => `
      <div class="visitor-card exited">
        <div class="visitor-info">
          <h3>${v.name}</h3>
          <p><strong>Flat:</strong> ${v.wing}-${v.flat}</p>
          <p><strong>Phone:</strong> ${v.phone}</p>
          <p class="time">Entered: ${v.entryTime}</p>
          <p class="time">Exited: ${v.exitTime}</p>
        </div>
      </div>
    `).join('');
  }
}

// Search listener
searchFlat.addEventListener('input', renderVisitors);

// Initial render
renderVisitors();