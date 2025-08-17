'use strict';

(function bookingModal(){
  const modal = document.getElementById('booking-modal');
  const closeBtn = document.getElementById('close-booking');
  const heroBtn = document.getElementById('hero-book-btn');
  function open(){ 
    if(modal){ 
      modal.style.display='flex'; 
      modal.setAttribute('aria-hidden','false'); 
      document.body.style.overflow = 'hidden';
      setTimeout(()=>document.getElementById('name')?.focus(), 100);
    } 
  }
  function close(){ 
    if(modal){ 
      modal.style.display='none'; 
      modal.setAttribute('aria-hidden','true'); 
      document.body.style.overflow = '';
    } 
  }
  document.getElementById('open-booking')?.addEventListener('click', open);
  heroBtn?.addEventListener('click', (e)=>{ e.preventDefault(); open(); });
  closeBtn?.addEventListener('click', close);
  modal?.addEventListener('click', (e)=>{ if(e.target===modal) close(); });
  // ESC key closes modal
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
})();

(function servicesAndForm(){
  const API = window.API;
  const servicesEl = document.getElementById('services-list');
  const selectEl = document.getElementById('service-select');
  const form = document.getElementById('booking-form');
  const msg = document.getElementById('form-message');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmBody = document.getElementById('confirm-body');
  const closeConfirm = document.getElementById('close-confirm');
  const confirmOk = document.getElementById('confirm-ok');
  function openConfirm(){ if(confirmModal){ confirmModal.style.display='flex'; confirmModal.setAttribute('aria-hidden','false'); } }
  function closeConfirmFn(){ if(confirmModal){ confirmModal.style.display='none'; confirmModal.setAttribute('aria-hidden','true'); } }
  closeConfirm?.addEventListener('click', closeConfirmFn);
  confirmModal?.addEventListener('click', (e)=>{ if(e.target===confirmModal) closeConfirmFn(); });
  confirmOk?.addEventListener('click', closeConfirmFn);

  const mockServices = [
    { _id: '1', name: 'Sunday Morning Service - Potchefstroom', description: 'Worship and teaching', time: '08:30', location: 'Dagbreek Estates' },
    { _id: '2', name: 'Sunday Evening Service - Potchefstroom', description: 'Worship and fellowship', time: '18:00', location: 'Dagbreek Estates' },
    { _id: '3', name: 'Sunday Morning Service - Klerksdorp', description: 'Worship and teaching', time: '10:00', location: 'Portuguese Hall' },
    { _id: '4', name: 'Sunday Evening Service - Klerksdorp', description: 'Worship and fellowship', time: '18:00', location: 'Portuguese Hall' },
    { _id: '5', name: "Heart-to-Heart Women's Meeting", description: 'Women discipleship and fellowship', time: '19:30', location: 'Dagbreek Estates' },
  ];

  function serviceCard(s){
    const div = document.createElement('div');
    div.className = 'service';
    div.innerHTML = `<h4>${s.name}</h4><div class="meta">⏰ ${s.time} • 📍 ${s.location} • 👥 Everyone welcome</div><p>${s.description||''}</p><button class="btn" data-id="${s._id}">Book</button>`;
    div.querySelector('button').onclick = ()=>{
      if(selectEl){ selectEl.value = s._id; }
      const openBtn = document.getElementById('open-booking'); openBtn?.click();
    };
    return div;
  }

  async function fetchServices(){
    try{
      const res = await fetch(`${API}/services`);
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(err){ console.warn('Services fallback to mock:', err.message); return mockServices; }
  }

  function renderServices(list){
    if(servicesEl){ servicesEl.innerHTML=''; list.forEach(s=> servicesEl.appendChild(serviceCard(s))); }
    if(selectEl){ selectEl.innerHTML=''; list.forEach(s=>{ const o=document.createElement('option'); o.value=s._id; o.textContent=s.name; selectEl.appendChild(o); }); if(list.length) selectEl.value=list[0]._id; }
  }

  function minDate(){ const d=new Date(); return d.toISOString().split('T')[0]; }
  const dateEl = document.getElementById('date'); if(dateEl){ dateEl.min = minDate(); }

  fetchServices().then(renderServices);

  function toast(message, ok=true){ if(msg){ msg.textContent=message; msg.style.color= ok ? '#2e7d32' : '#d32f2f'; } }

  function addBookingToList(b){
    const list = document.getElementById('bookings-list');
    if(!list) return;
    const div = document.createElement('div');
    div.className = 'booking';
    div.innerHTML = `<strong>${b.serviceName}</strong><div class="meta">${b.date} • ${b.time} • ${b.attendees} attendee(s) • ${b.location||''}</div><div>Status: ${b.status||'confirmed'}</div>`;
    list.prepend(div);
  }

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      serviceId: selectEl?.value,
      date: document.getElementById('date')?.value,
      time: document.getElementById('time')?.value,
      userName: document.getElementById('name')?.value.trim(),
      userEmail: document.getElementById('email')?.value.trim(),
      attendees: Number(document.getElementById('attendees')?.value||'1'),
      specialRequests: document.getElementById('requests')?.value.trim(),
    };
    if(!payload.serviceId || !payload.date || !payload.time || !payload.userName || !payload.userEmail || !payload.attendees){
      return toast('Please fill in all required fields', false);
    }
    try{
      const res = await fetch(`${API}/bookings`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if(!res.ok){ const body = await res.json().catch(()=>({message:'Booking failed'})); throw new Error(body.message||'Booking failed'); }
      const booking = await res.json();
      toast('Booking confirmed! Confirmation: ' + (booking.confirmationNumber || '✓'));
      addBookingToList({ serviceName: booking.serviceName, date: booking.date, time: booking.time, attendees: booking.attendees, status: booking.status||'confirmed', location: booking.location });
      form.reset();
      document.getElementById('close-booking')?.click();
      if(confirmBody){
        const num = booking.confirmationNumber || '✓';
        confirmBody.innerHTML = `<div class="booking"><strong>${booking.serviceName}</strong><div class="meta">${booking.date} • ${booking.time} • ${booking.attendees} attendee(s) • ${booking.location||''}</div><div>Confirmation: <strong>${num}</strong></div>`;
        confirmModal && (confirmModal.style.display='flex', confirmModal.setAttribute('aria-hidden','false'));
      }
    }catch(err){ toast(err.message, false); }
  });
})();
