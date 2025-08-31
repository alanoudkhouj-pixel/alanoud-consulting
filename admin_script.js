// Admin page logic: add/list slots using localStorage as storage
const listEl = document.getElementById('schedulesList');
const form = document.getElementById('addSlotForm');
const langBtn = document.getElementById('lang-toggle-btn');
let lang = localStorage.getItem('lang') || 'ar';
function t(ar,en){ return lang==='ar'?ar:en; }

function read(){ return JSON.parse(localStorage.getItem('schedules') || '[]'); }
function write(arr){ localStorage.setItem('schedules', JSON.stringify(arr)); }

function colorForService(s){
  if(s.includes('ذكاء') || s.toLowerCase().includes('ai')) return '#9f7aea';
  if(s.includes('هاك') || s.toLowerCase().includes('hack')) return '#4b89dc';
  return '#4CAF50';
}

function render(){
  const arr = read();
  listEl.innerHTML='';
  if(arr.length===0){
    const p = document.createElement('p');
    p.textContent = t('لا توجد مواعيد بعد. أضف موعداً من النموذج.', 'No slots yet. Add one from the form.');
    listEl.appendChild(p); return;
  }
  arr.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));
  arr.forEach(s=>{
    const item = document.createElement('div');
    item.className='slot-item';
    item.style.borderRightColor = colorForService(s.service);
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap">
        <div>
          <div><strong>${s.date}</strong> — ${s.time}</div>
          <div>${s.service}</div>
        </div>
        <div>
          <span class="status-badge ${s.booked?'status-booked':'status-available'}">
            ${s.booked? t('محجوز', 'Booked') : t('متاح', 'Available')}
          </span>
          <button data-id="${s.id}" class="delete-btn" style="margin-inline-start:8px">${t('حذف','Delete')}</button>
          ${s.booked ? `<div style="margin-top:.5rem; font-size:.9rem">${t('العميل:','Client:')} ${s.client?.name || ''} — ${s.client?.email || ''}</div>`:''}
        </div>
      </div>`;
    listEl.appendChild(item);
  });
  document.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      const next = read().filter(s=> s.id !== id);
      write(next); render();
    });
  });
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const date = document.getElementById('slotDate').value;
  const time = document.getElementById('slotTime').value;
  const service = document.getElementById('slotService').value;
  if(!date || !time || !service) return;
  const arr = read();
  const id = Math.random().toString(36).slice(2,10);
  arr.push({ id, date, time, service, booked:false });
  write(arr); form.reset(); render();
});

langBtn.addEventListener('click', ()=>{
  lang = (lang==='ar')?'en':'ar'; localStorage.setItem('lang', lang);
  document.getElementById('main-title').textContent = t('لوحة تحكم العنود','Alanoud Dashboard');
  document.getElementById('subtitle').textContent = t('إدارة مواعيد الاستشارات المتاحة','Manage available consultation slots');
  document.getElementById('add-slot-title').textContent = t('إضافة موعد جديد','Add New Slot');
  document.getElementById('date-label').textContent = t('التاريخ','Date');
  document.getElementById('time-label').textContent = t('الوقت','Time');
  document.getElementById('service-label').textContent = t('الخدمة','Service');
  document.getElementById('current-slots-title').textContent = t('المواعيد الحالية','Current Slots');
  document.getElementById('add-slot-btn').textContent = t('إضافة موعد','Add Slot');
  render();
});

render();
