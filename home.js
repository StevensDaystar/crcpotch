'use strict';

(function homeHero(){
  const bg = document.getElementById('hero-bg');
  if(!bg) return;
  // Image paths – using provided CRC images
  const base = './crc_church_images/';
  const imgs = [
    base + 'photo_1_2025-08-16_11-12-50.jpg',
    base + 'photo_2_2025-08-16_11-12-50.jpg',
    base + 'photo_3_2025-08-16_11-12-50.jpg',
    base + 'photo_4_2025-08-16_11-12-50.jpg',
    base + 'photo_5_2025-08-16_11-12-50.jpg',
  ];
  let i = 0;
  function set(idx){ bg.style.backgroundImage = `url('${imgs[idx]}')`; }
  set(0);
  setInterval(()=>{ i = (i+1)%imgs.length; set(i); }, 7000);
})();

(function footerYear(){
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
})();
