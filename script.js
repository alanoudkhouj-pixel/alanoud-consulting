// Simple front-end booking logic using localStorage as a fake DB
const modal = document.getElementById('bookingModal');
const confirmModal = document.getElementById('confirmationModal');
const errorModal = document.getElementById('errorModal');
const appointmentSelect = document.getElementById('appointmentSlot');
const confirmBtn = document.getElementById('confirmBookingBtn');
const langBtn = document.getElementById('lang-toggle-btn');
let currentService = null;
let lang = localStorage.getItem('lang') || 'ar';

function t(ar, en){ return lang === 'ar' ? ar : en; }

function translateUI(){
  document.getElementById('lang-toggle-btn').textContent = t('English', 'العربية');
  document.getElementById('welcome-heading').textContent = t('أهلاً بك', 'Welcome');
  document.getElementById('name-heading').textContent = t('العنود خوج', 'Alanoud Khouj');
  document.getElementById('bio-text').textContent = t('متخصصة في الحلول التقنية والابتكار. هنا يمكنك حجز استشارة لمناقشة أفكارك ومشاريعك.', 'Tech & Innovation Consultant. Book a session to discuss your ideas and projects.');
  document.getElementById('services-title').textContent = t('اختر نوع الاستشارة:', 'Choose a consultation:');
  document.getElementById('service1-title').textContent = t('استشارة تقنية عامة', 'General Tech Consultation');
  document.getElementById('service1-desc').textContent = t('مناقشة أفكار المشاريع، استراتيجيات التطوير، أو أي أسئلة تقنية.', 'Project ideas, development strategy, or general tech questions.');
  document.getElementById('service2-title').textContent = t('استشارة في الذكاء الاصطناعي وحلول تقنية', 'AI & Tech Solutions Consultation');
  document.getElementById('service2-desc').textContent = t('تقييم جدوى مشروع AI، اختيار النماذج، وبناء الحلول.', 'AI feasibility, model selection, and solution design.');
  document.getElementById('service3-title').textContent = t('استشارة للمشاركة في هاكاثون', 'Hackathon Coaching');
  document.getElementById('service3-desc').textContent = t('تجهيزك للمشاركة في الهاكاثونات، تحديد الأفكار، وبناء خطة عمل سريعة وفعالة.', 'Prep for hackathons, ideas, and rapid action plans.');
  document.getElementById('modalTitle').textContent = t('حجز موعد', 'Book a Slot');
  document.querySelector('label[for=\"clientName\"]').textContent = t('الاسم الكامل', 'Full name');
  document.querySelector('label[for=\"clientEmail\"]').textContent = t('البريد الإلكتروني', 'Email');
  document.querySelector('label[for=\"appointmentSlot\"]').textContent = t('اختر موعداً متاحاً', 'Choose an available slot');
  document.querySelector('label[for=\"projectDetails\"]').textContent = t('تفاصيل الاستشارة', 'Consultation details');
  document.getElementById('confirmBookingBtn').textContent = t('تأكيد الحجز', 'Confirm Booking');
}

function openModal(id){ document.getElementById(id).classList.add('is-visible'); }
function closeModal(id){ document.getElementById(id).classList.remove('is-visible'); }

window.closeModal = closeModal;

function listAvailableSlots(){
  const all = JSON.parse(localStorage.getItem('schedules') || '[]');
  const available = all.filter(s => !s.booked);
  appointmentSelect.innerHTML = '';
  if(available.length === 0){
    const opt = document.createElement('option');
    opt.value=''; opt.textContent = t('لا توجد مواعيد متاحة حالياً', 'No slots available now');
    appointmentSelect.appendChild(opt);
    appointmentSelect.disabled = true;
  }else{
    appointmentSelect.disabled = false;
    available.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.date} — ${s.time} — ${s.service}`;
      appointmentSelect.appendChild(opt);
    });
  }
}

function bindServiceCards(){
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      currentService = card.dataset.service;
      document.getElementById('modalDuration').textContent = t('المدة التقريبية: ', 'Estimated duration: ') + card.dataset.duration + t(' دقيقة', ' min');
      listAvailableSlots();
      openModal('bookingModal');
    });
  });
}

document.getElementById('bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const slotId = appointmentSelect.value;
  if(!name || !email || !slotId){ openModal('errorModal'); return; }
  const all = JSON.parse(localStorage.getItem('schedules') || '[]');
  const idx = all.findIndex(s=> s.id === slotId);
  if(idx === -1 || all[idx].booked){ openModal('errorModal'); return; }
  all[idx].booked = true;
  all[idx].client = { name, email, details: document.getElementById('projectDetails').value };
  localStorage.setItem('schedules', JSON.stringify(all));
  document.getElementById('confirmationMessage').textContent = t('ستتلقى رسالة تأكيد على بريدك الإلكتروني.', 'You will receive a confirmation by email.');
  const meetLink = `https://meet.google.com/lookup/${Math.random().toString(36).slice(2,8)}`;
  const a = document.getElementById('googleMeetLink'); a.href = meetLink;
  closeModal('bookingModal'); openModal('confirmationModal');
  e.target.reset();
});

langBtn.addEventListener('click', ()=>{
  lang = (lang === 'ar') ? 'en' : 'ar'; localStorage.setItem('lang', lang); translateUI();
});

translateUI(); bindServiceCards();
