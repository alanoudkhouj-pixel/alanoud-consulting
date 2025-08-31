// Firebase Libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, where, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

setLogLevel('debug');

// Global Firebase variables
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userId = null;

// Localization Data
const translations = {
    ar: {
        title: 'لوحة تحكم العنود',
        subtitle: 'إدارة مواعيد الاستشارات المتاحة',
        addSlotTitle: 'إضافة موعد جديد',
        dateLabel: 'التاريخ',
        timeLabel: 'الوقت',
        serviceLabel: 'الخدمة',
        addSlotBtn: 'إضافة موعد',
        currentSlotsTitle: 'المواعيد الحالية',
        loadingSlots: 'جاري تحميل المواعيد...',
        noSlots: 'لا توجد مواعيد حالياً. يرجى إضافة مواعيد جديدة.',
        booked: 'محجوز',
        available: 'متاح',
        clientName: 'العميل:',
        clientEmail: 'البريد:',
        meetLink: 'رابط الاجتماع:',
        details: 'التفاصيل:',
        alertSuccess: 'تمت إضافة الموعد بنجاح!',
        alertError: 'حدث خطأ أثناء إضافة الموعد. حاول مرة أخرى.',
        allFieldsRequired: 'الرجاء اختيار التاريخ والوقت.',
        generalConsultation: 'استشارة تقنية عامة',
        aiConsultation: 'استشارة في الذكاء الاصطناعي وحلول تقنية',
        hackathonConsultation: 'استشارة للمشاركة في هاكاثون',
        language: 'English'
    },
    en: {
        title: 'Al-Anoud Admin Dashboard',
        subtitle: 'Manage Available Consultation Slots',
        addSlotTitle: 'Add New Slot',
        dateLabel: 'Date',
        timeLabel: 'Time',
        serviceLabel: 'Service',
        addSlotBtn: 'Add Slot',
        currentSlotsTitle: 'Current Schedules',
        loadingSlots: 'Loading schedules...',
        noSlots: 'No schedules at the moment. Please add new ones.',
        booked: 'Booked',
        available: 'Available',
        clientName: 'Client:',
        clientEmail: 'Email:',
        meetLink: 'Meet Link:',
        details: 'Details:',
        alertSuccess: 'Slot added successfully!',
        alertError: 'An error occurred while adding the slot. Please try again.',
        allFieldsRequired: 'Please select a date and time.',
        generalConsultation: 'General Technical Consultation',
        aiConsultation: 'AI & Technical Solutions Consultation',
        hackathonConsultation: 'Hackathon Participation Consultation',
        language: 'العربية'
    }
};

let currentLang = 'ar';

// UI Elements
const langToggleBtn = document.getElementById('lang-toggle-btn');
const addSlotForm = document.getElementById('addSlotForm');
const schedulesList = document.getElementById('schedulesList');

// Language switching logic
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    document.title = t.title;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    document.getElementById('main-title').textContent = t.title;
    document.getElementById('subtitle').textContent = t.subtitle;
    document.getElementById('add-slot-title').textContent = t.addSlotTitle;
    document.getElementById('date-label').textContent = t.dateLabel;
    document.getElementById('time-label').textContent = t.timeLabel;
    document.getElementById('service-label').textContent = t.serviceLabel;
    document.getElementById('add-slot-btn').textContent = t.addSlotBtn;
    document.getElementById('current-slots-title').textContent = t.currentSlotsTitle;
    document.getElementById('loading-slots').textContent = t.loadingSlots;
    document.getElementById('general-option').textContent = t.generalConsultation;
    document.getElementById('ai-option').textContent = t.aiConsultation;
    document.getElementById('hackathon-option').textContent = t.hackathonConsultation;
    langToggleBtn.textContent = t.language;
}

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(currentLang);
    // Re-render schedules to apply new language
    const dummySchedules = Array.from(schedulesList.children).map(el => {
        const id = el.dataset.id;
        const startTime = el.querySelector('.time-display').textContent;
        const service = el.querySelector('.service-display').textContent;
        const isBooked = el.querySelector('.status-badge').textContent.trim() === 'محجوز' || el.querySelector('.status-badge').textContent.trim() === 'Booked';
        
        let clientName = null, clientEmail = null, googleMeetLink = null, projectDetails = null;
        if (isBooked) {
            clientName = el.querySelector('.client-name').textContent;
            clientEmail = el.querySelector('.client-email').textContent;
            googleMeetLink = el.querySelector('.meet-link').href;
            projectDetails = el.querySelector('.details-text').textContent;
        }

        return { id, startTime, service, isBooked, clientName, clientEmail, googleMeetLink, projectDetails };
    });
    renderSchedules(dummySchedules);
});

// Authentication and UI state management
async function initAuth() {
    try {
        if (authToken) {
            await signInWithCustomToken(auth, authToken);
        } else {
            await signInAnonymously(auth);
        }
        userId = auth.currentUser.uid;
        startListeners();
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
}

// Firestore References
const schedulesCollection = collection(db, `artifacts/${appId}/users/${userId}/schedules`);

// Admin Panel Functions
addSlotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slotDate = document.getElementById('slotDate').value;
    const slotTime = document.getElementById('slotTime').value;
    const t = translations[currentLang];

    if (!slotDate || !slotTime) {
        alert(t.allFieldsRequired);
        return;
    }

    const slotDateTime = `${slotDate}T${slotTime}:00`;

    const newDoc = {
        startTime: slotDateTime,
        service: document.getElementById('slotService').value,
        isBooked: false,
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(schedulesCollection, newDoc);
        alert(t.alertSuccess);
        addSlotForm.reset();
    } catch (error) {
        console.error("Error adding document:", error);
        alert(t.alertError);
    }
});

function startListeners() {
    onSnapshot(schedulesCollection, (snapshot) => {
        const schedules = [];
        snapshot.forEach((doc) => {
            schedules.push({ id: doc.id, ...doc.data() });
        });
        renderSchedules(schedules);
    }, (error) => {
        console.error("Error listening to schedules:", error);
    });
}
        
function renderSchedules(schedules) {
    schedulesList.innerHTML = ''; // Clear previous list
    const t = translations[currentLang];

    if (schedules.length === 0) {
        schedulesList.innerHTML = `<p class="text-gray-500 text-center">${t.noSlots}</p>`;
        return;
    }

    schedules.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    schedules.forEach(schedule => {
        const isBooked = schedule.isBooked;
        const statusColor = isBooked ? '#F44336' : '#4CAF50';
        const statusText = isBooked ? t.booked : t.available;
        const borderColor = isBooked ? 'border-red-500' : 'border-green-500';
        
        const clientInfo = isBooked ? `
            <p class="text-sm"><strong>${t.clientName}</strong> <span class="client-name">${schedule.clientName}</span></p>
            <p class="text-sm"><strong>${t.clientEmail}</strong> <span class="client-email">${schedule.clientEmail}</span></p>
            <p class="text-sm"><strong>${t.meetLink}</strong> <a href="${schedule.googleMeetLink}" target="_blank" class="text-purple-400 hover:underline meet-link">انقر هنا</a></p>
            <p class="text-sm mt-2"><strong>${t.details}</strong> <span class="details-text">${schedule.projectDetails}</span></p>
        ` : '';

        const listItem = document.createElement('div');
        listItem.className = `slot-item`;
        listItem.style.borderColor = statusColor;
        listItem.dataset.id = schedule.id;

        listItem.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <i class="ph ph-calendar text-2xl mr-2 text-gray-400"></i>
                    <span class="text-lg font-semibold time-display">${new Date(schedule.startTime).toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
                <span class="status-badge" style="background-color: ${statusColor};">${statusText}</span>
            </div>
            <p class="text-sm text-gray-400 service-display mb-2">${schedule.service}</p>
            ${clientInfo}
        `;
        schedulesList.appendChild(listItem);
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', initAuth);
