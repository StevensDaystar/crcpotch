'use strict';

const API = (window.API_BASE || 'http://localhost:5000') + '/api';
let ADMIN_TOKEN = localStorage.getItem('admin_token') || '';
const els = {
  services: document.getElementById('services-list'),
  serviceSelect: document.getElementById('service-select'),
  bookings: document.getElementById('bookings-list'),
  form: document.getElementById('booking-form'),
  msg: document.getElementById('form-message'),
};

// Nav responsiveness
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');
if(menuBtn && nav){
  menuBtn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
  }));
}

// Booking modal controls
const bookingModal = document.getElementById('booking-modal');
const openBookingBtn = document.getElementById('open-booking');
const heroBookBtn = document.getElementById('hero-book-btn');
const closeBookingBtn = document.getElementById('close-booking');
function openModal(m){ m.style.display = 'flex'; m.setAttribute('aria-hidden','false'); }
function closeModal(m){ m.style.display = 'none'; m.setAttribute('aria-hidden','true'); }
function openBooking(){ openModal(bookingModal); setTimeout(()=>{ document.getElementById('name')?.focus(); }, 50); }
openBookingBtn?.addEventListener('click', openBooking);
heroBookBtn?.addEventListener('click', (e)=>{ e.preventDefault(); openBooking(); });
closeBookingBtn?.addEventListener('click', ()=> closeModal(bookingModal));
bookingModal?.addEventListener('click', (e)=>{ if(e.target === bookingModal) closeModal(bookingModal); });

const mockServices = [
  { _id: '1', name: 'Sunday Morning Service', description: 'Worship and teaching', time: '08:30', location: 'Dagbreek Estates' },
  { _id: '2', name: "Heart-to-Heart Women's Meeting", description: 'Women discipleship', time: '19:30', location: 'Dagbreek Estates' },
];

function toast(message, ok=true){
  els.msg.textContent = message;
  els.msg.style.color = ok? '#2e7d32' : '#d32f2f';
}

function cardService(s){
  const div = document.createElement('div');
  div.className = 'service';
  div.innerHTML = `
    <h4>${s.name}</h4>
  <div class="meta">⏰ ${s.time} • 📍 ${s.location} • 👥 Everyone welcome</div>
    <p>${s.description || ''}</p>
    <button class="btn" data-id="${s._id}">Book</button>
  `;
  div.querySelector('button').onclick = () => {
    els.serviceSelect.value = s._id;
  openBooking();
  };
  return div;
}

async function fetchServices(){
  try {
    const res = await fetch(`${API}/services`);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    renderServices(data);
  } catch(err){
    console.warn('Services fallback to mock:', err.message);
    renderServices(mockServices);
  }
}

function renderServices(list){
  els.services.innerHTML = '';
  els.serviceSelect.innerHTML = '';
  list.forEach(s => {
    els.services.appendChild(cardService(s));
    const opt = document.createElement('option');
    opt.value = s._id; opt.textContent = s.name;
    els.serviceSelect.appendChild(opt);
  });
  if(list.length){ els.serviceSelect.value = list[0]._id; }
  // no capacity
}

function minDate(){
  const d = new Date();
  return d.toISOString().split('T')[0];
}

document.getElementById('date').min = minDate();

els.form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const payload = {
    serviceId: els.serviceSelect.value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    userName: document.getElementById('name').value.trim(),
    userEmail: document.getElementById('email').value.trim(),
    attendees: Number(document.getElementById('attendees').value),
    specialRequests: document.getElementById('requests').value.trim(),
  };
  if(!payload.serviceId || !payload.date || !payload.time || !payload.userName || !payload.userEmail || !payload.attendees){
    return toast('Please fill in all required fields', false);
  }

  try{
    const res = await fetch(`${API}/bookings`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if(!res.ok){
      const body = await res.json().catch(()=>({ message:'Booking failed'}));
      throw new Error(body.message || 'Booking failed');
    }
    const booking = await res.json();
    toast('Booking confirmed! Confirmation: ' + (booking.confirmationNumber || '✓'));
    addBookingToList({
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      attendees: booking.attendees,
      status: booking.status || 'confirmed',
      location: booking.location,
    });
  // no remaining calc; unlimited seats
    els.form.reset();
  closeModal(bookingModal);
  showConfirmation(booking);
  }catch(err){
    toast(err.message, false);
  }
});

function addBookingToList(b){
  const div = document.createElement('div');
  div.className = 'booking';
  div.innerHTML = `<strong>${b.serviceName}</strong><div class="meta">${b.date} • ${b.time} • ${b.attendees} attendee(s) • ${b.location}</div><div>Status: ${b.status}</div>`;
  els.bookings.prepend(div);
}

fetchServices();

document.getElementById('year').textContent = new Date().getFullYear();

// Save admin token
const adminMsg = document.getElementById('admin-message');
const btnLogin = document.getElementById('admin-login');
const btnLogout = document.getElementById('admin-logout');
const adminAuth = document.getElementById('admin-auth');

function updateAuthUI(){
  if(ADMIN_TOKEN){
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    adminMsg.textContent = 'Logged in as admin'; adminMsg.style.color = '#2e7d32';
  }else{
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    adminMsg.textContent = '';
  }
}

if(btnLogin){
  btnLogin.onclick = async () => {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    try{
      const res = await fetch(`${API}/auth/login`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message || 'Login failed');
      ADMIN_TOKEN = data.token; localStorage.setItem('admin_token', ADMIN_TOKEN);
      updateAuthUI();
      loadAdmin();
    }catch(err){ adminMsg.textContent = err.message; adminMsg.style.color = '#d32f2f'; }
  };
}

if(btnLogout){
  btnLogout.onclick = () => {
    ADMIN_TOKEN = ''; localStorage.removeItem('admin_token'); updateAuthUI();
    document.getElementById('admin-summary').innerHTML = '';
    document.getElementById('admin-lists').innerHTML = '';
  };
}

updateAuthUI();

async function authFetch(url, opts={}){
  const headers = Object.assign({}, opts.headers || {}, ADMIN_TOKEN ? { Authorization: 'Bearer '+ADMIN_TOKEN } : {});
  const res = await fetch(url, { ...opts, headers });
  if(res.status === 401 || res.status === 403) throw new Error('Unauthorized');
  return res;
}

async function loadAdmin(){
  if(!ADMIN_TOKEN) return;
  try{
    const res = await authFetch(`${API}/admin/analytics/summary`);
    const data = await res.json();
    const el = document.getElementById('admin-summary');
    el.innerHTML = `<div class="booking">Totals — Bookings: ${data.totals.bookings}, Prayer: ${data.totals.prayers}, Connect: ${data.totals.connects}, Volunteers: ${data.totals.volunteers}, Testimonies: ${data.totals.testimonies}</div>`;
    await Promise.all([
      loadList('prayer','/prayer'),
      loadList('connect','/connect'),
      loadList('volunteers','/volunteers'),
      loadList('testimonies','/testimonies')
    ]);
  }catch(err){ adminMsg.textContent = 'Admin load failed: '+err.message; adminMsg.style.color = '#d32f2f'; }
}

async function loadList(name, path){
  const wrap = document.getElementById('admin-lists');
  const panel = document.createElement('div'); panel.className = 'card';
  panel.innerHTML = `<h4 style="margin:0 0 6px 0">${name}</h4><div class="list" id="list-${name}"></div>`;
  wrap.appendChild(panel);
  try{
    const res = await authFetch(`${API}${path}`);
    const data = await res.json();
    const list = panel.querySelector(`#list-${name}`);
    data.slice(0,30).forEach(item => {
      const div = document.createElement('div');
      div.className = 'booking';
      const summary = item.name || item.userName || item.email || item._id;
      const status = item.status || 'n/a';
      div.innerHTML = `<div><strong>${summary}</strong> <span class="meta">${new Date(item.createdAt).toLocaleString()}</span></div><div>Status: <em>${status}</em></div>`;
      // status updater
      const btn = document.createElement('button');
      btn.className = 'btn'; btn.style.marginTop = '6px'; btn.textContent = 'Mark Reviewed';
      btn.onclick = async () => {
        try{
          const res2 = await authFetch(`${API}${path}/${item._id}/status`,{ method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status: 'reviewed' }) });
          if(!res2.ok) throw new Error('Update failed');
          btn.textContent = 'Reviewed'; btn.disabled = true;
        }catch(err){ alert('Failed: '+err.message); }
      };
      list.appendChild(div); list.appendChild(btn);
    });
  }catch(err){
    const list = panel.querySelector(`#list-${name}`);
    list.innerHTML = `<div class="muted">Failed to load: ${err.message}</div>`;
  }
}

// CSV exports
document.querySelectorAll('[data-export]').forEach(btn => {
  btn.onclick = async () => {
    const entity = btn.getAttribute('data-export');
    try{
      const res = await authFetch(`${API}/admin/export/${entity}.csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${entity}.csv`; a.click();
      URL.revokeObjectURL(url);
    }catch(err){ adminMsg.textContent = 'Export failed: '+err.message; adminMsg.style.color = '#d32f2f'; }
  };
});

loadAdmin();

// extra church forms wiring
document.getElementById('prayer-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const payload = {
    name: document.getElementById('prayer-name').value.trim(),
    email: document.getElementById('prayer-email').value.trim(),
    category: document.getElementById('prayer-category').value,
    request: document.getElementById('prayer-text').value.trim(),
    confidential: document.getElementById('prayer-confidential').checked
  };
  const elMsg = document.getElementById('prayer-message');
  try{
    const res = await fetch(`${API}/prayer`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Failed to submit');
    elMsg.textContent = 'Thank you. Our team will pray with you.';
    elMsg.style.color = '#2e7d32';
    e.target.reset();
  }catch(err){ elMsg.textContent = 'Submission failed'; elMsg.style.color = '#d32f2f'; }
});

document.getElementById('connect-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const select = document.getElementById('connect-interested');
  const interestedIn = Array.from(select.selectedOptions).map(o=>o.value);
  const payload = {
    name: document.getElementById('connect-name').value.trim(),
    email: document.getElementById('connect-email').value.trim(),
    phone: document.getElementById('connect-phone').value.trim(),
    interestedIn,
    notes: document.getElementById('connect-notes').value.trim()
  };
  const elMsg = document.getElementById('connect-message');
  try{
    const res = await fetch(`${API}/connect`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Failed to submit');
    elMsg.textContent = 'Thanks! We will contact you soon.';
    elMsg.style.color = '#2e7d32';
    e.target.reset();
  }catch(err){ elMsg.textContent = 'Submission failed'; elMsg.style.color = '#d32f2f'; }
});

document.getElementById('volunteer-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const select = document.getElementById('vol-ministries');
  const ministries = Array.from(select.selectedOptions).map(o=>o.value);
  const payload = {
    name: document.getElementById('vol-name').value.trim(),
    email: document.getElementById('vol-email').value.trim(),
    ministries,
    availability: document.getElementById('vol-availability').value.trim()
  };
  const elMsg = document.getElementById('vol-message');
  try{
    const res = await fetch(`${API}/volunteers`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Failed to submit');
    elMsg.textContent = 'Thank you for stepping up to serve!';
    elMsg.style.color = '#2e7d32';
    e.target.reset();
  }catch(err){ elMsg.textContent = 'Submission failed'; elMsg.style.color = '#d32f2f'; }
});

document.getElementById('testimony-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const payload = {
    name: document.getElementById('test-name').value.trim(),
    email: document.getElementById('test-email').value.trim(),
    testimony: document.getElementById('test-text').value.trim(),
    permissionToShare: document.getElementById('test-permission').checked
  };
  const elMsg = document.getElementById('test-message');
  try{
    const res = await fetch(`${API}/testimonies`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Failed to submit');
    elMsg.textContent = 'Thank you for sharing your story!';
    elMsg.style.color = '#2e7d32';
    e.target.reset();
  }catch(err){ elMsg.textContent = 'Submission failed'; elMsg.style.color = '#d32f2f'; }
});

// Confirmation modal
const confirmModal = document.getElementById('confirm-modal');
const closeConfirm = document.getElementById('close-confirm');
const confirmOk = document.getElementById('confirm-ok');
function showConfirmation(b){
  const body = document.getElementById('confirm-body');
  const num = b.confirmationNumber || '✓';
  body.innerHTML = `<div class="booking"><strong>${b.serviceName}</strong><div class="meta">${b.date} • ${b.time} • ${b.attendees} attendee(s) • ${b.location || ''}</div><div>Confirmation: <strong>${num}</strong></div></div>`;
  openModal(confirmModal);
}
closeConfirm?.addEventListener('click', ()=> closeModal(confirmModal));
confirmModal?.addEventListener('click', (e)=>{ if(e.target === confirmModal) closeModal(confirmModal); });
confirmOk?.addEventListener('click', ()=> closeModal(confirmModal));
