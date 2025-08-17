'use strict';

// API base
window.API = (window.API_BASE || 'http://localhost:5000') + '/api';

// Theme
(function themeInit(){
  const key = 'theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(key);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(saved === 'dark' || (!saved && prefersDark)){
    root.classList.add('dark');
  }
  // If there is no toggle on the page, do nothing else
})();

// Menu
(function menuInit(){
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if(!menuBtn || !nav) return;
  menuBtn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  // Close menu when clicking outside
  document.addEventListener('click', (e)=>{
    if(!nav.contains(e.target) && !menuBtn.contains(e.target)){
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false');
    }
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
  }));
})();
