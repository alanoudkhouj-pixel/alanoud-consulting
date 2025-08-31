// Firebase Libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, onSnapshot, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// EmailJS Library
import "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";

setLogLevel('debug');

// Global Firebase variables
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// EmailJS credentials (Replace with your actual credentials)
const EMAILJS_SERVICE_ID = 'service_your_service_id';
const EMAILJS_TEMPLATE_ID = 'template_your_template_id';
const EMAILJS_PUBLIC_KEY = 'your_public_key';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userId = null;
let currentService = null;

// Localization Data
const translations = {
    ar: {
        welcomeHeading: 'أهلاً بك',
        nameHeading: 'العنود خوج',
        bioText: 'متخصصة في الحلول التقنية والابتكار. هنا يمكنك حجز استشارة لمناقشة أفكارك ومشاريعك.',
        servicesTitle: 'اختر نوع الاستشارة:',
        service1Title: 'استشارة تقنية عامة',
        service1Desc: 'مناقشة أفكار المشاريع، استراتيجيات التطوير، أو أي أسئلة تقنية.',
        service2Title: 'استشارة في الذكاء الاصطناعي وحلول تقنية',
        service2Desc: 'تقييم جدوى مشروع AI، اختيار النماذج، وبناء الحلول.',
        service3Title: 'استشارة للمشاركة في هاكاثون',
        service3Desc: 'تجهيزك للمشاركة في الهاكاثونات، تحديد الأفكار، وبناء خطة عمل سريعة وفعالة.',
        modalTitle: 'حجز موعد',
        modalDuration: 'مدة الاستشارة: {duration} دقيقة',
        clientNameLabel: 'الاسم الكامل',
        clientEmailLabel: 'البريد الإلكتروني',
        appointmentSlotLabel: 'اختر موعداً متاحاً',
        projectDetailsLabel: 'تفاصيل الاستشارة',
        confirmBookingBtn: 'تأكيد الحجز',
        loadingSlots: 'جاري تحميل المواعيد...',
        noSlots: 'لا توجد مواعيد متاحة حالياً. يرجى المحاولة لاحقاً.',
        confirmationTitle: 'تم تأكيد حجزك بنجاح!',
        confirmationMessage: 'ستتلقى رسالة تأكيد على بريدك الإلكتروني.',
        joinMeetingBtn: 'الانضمام للاجتماع',
        errorTitle: 'حدث خطأ',
        errorMessage: 'الرجاء إدخال جميع البيانات المطلوبة.',
        okBtn: 'حسناً',
        language: 'English',
        successBooking: 'تم حجز الموعد بنجاح! سيتم إرسال رسالة تأكيد إلى بريدك الإلكتروني.'
    },
    en: {
        welcomeHeading: 'Welcome',
        nameHeading: 'Al-Anoud Khouj',
        bioText: 'Specializing in technical solutions and innovation. Here you can book a consultation to discuss your ideas and projects.',
        servicesTitle: 'Choose the consultation type:',
        service1Title: 'General Technical Consultation',
        service1Desc: 'Discuss project ideas, development strategies, or any technical questions.',
        service2Title: 'AI & Technical Solutions Consultation',
        service2Desc: 'Evaluate AI project feasibility, model selection, and solution building.',
        service3Title: 'Hackathon Participation Consultation',
        service3Desc: 'Prepare you for hackathons, define ideas, and build a quick and effective action plan.',
        modalTitle: 'Book an Appointment',
        modalDuration: 'Consultation Duration: {duration} minutes',
        clientNameLabel: 'Full Name',
        clientEmailLabel: 'Email Address',
        appointmentSlotLabel: 'Choose an available slot',
        projectDetailsLabel: 'Consultation Details',
        confirmBookingBtn: 'Confirm Booking',
        loadingSlots: 'Loading available slots...',
        noSlots: 'No slots currently available. Please try again later.',
        confirmationTitle: 'Booking Confirmed!',
        confirmationMessage: 'You will receive a confirmation email shortly.',
        joinMeetingBtn: 'Join the Meeting',
        errorTitle: 'An Error Occurred',
        errorMessage: 'Please fill in all required fields.',
        okBtn: 'OK',
        language: 'العربية',
        successBooking: 'Appointment booked successfully! A confirmation email will be sent to your email.'
    }
};

let currentLang = 'ar';
let availableSlots = [];
let selectedSlotId = null;

// UI Elements
const langToggleBtn = document.getElementById('lang-toggle-btn');
const bookingModal = document.getElementById('bookingModal');
const confirmationModal = document.getElementById('confirmationModal');
const errorModal = document.getElementById('errorModal');
const bookingForm = document.getElementById('bookingForm');
const appointmentSlotSelect = document.getElementById('appointmentSlot');
const googleMeetLinkBtn = document.getElementById('googleMeetLink');

// Language switching logic
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    document.getElementById('welcome-heading').textContent = t.welcomeHeading;
    document.getElementById('name-heading').textContent = t.nameHeading;
    document.getElementById('bio-text').textContent = t.bioText;
    document.getElementById('services-title').textContent = t.servicesTitle;
    document.getElementById('service1-title').textContent = t.service1Title;
    document.getElementById('service1-desc').textContent = t.service1Desc;
    document.getElementById('service2-title').textContent = t.service2Title;
    document.getElementById('service2-desc').textContent = t.service2Desc;
    document.getElementById('service3-title').textContent = t.service3Title;
    document.getElementById('service3-desc').textContent = t.service3Desc;
    document.getElementById('modalTitle').textContent = t.modalTitle;
    document.getElementById('clientName').previousElementSibling.textContent = t.clientNameLabel;
    document.getElementById('clientEmail').previousElementSibling.textContent = t.clientEmailLabel;
    document.getElementById('appointmentSlot').previousElementSibling.textContent = t.appointmentSlotLabel;
    document.getElementById('projectDetails').previousElementSibling.textContent = t.projectDetailsLabel;
    document.getElementById('confirmBookingBtn').textContent = t.confirmBookingBtn;
    document.getElementById('confirmationTitle').textContent = t.confirmationTitle;
    document.getElementById('confirmationMessage').textContent = t.confirmationMessage;
    document.getElementById('googleMeetLink').textContent = t.joinMeetingBtn;
    document.getElementById('errorTitle').textContent = t.errorTitle;
    document.getElementById('errorMessage').textContent = t.errorMessage;
    document.getElementById('lang-toggle-btn').textContent = t.language;
    
    // Update booking modal duration and slots
    if (currentService) {
        document.getElementById('modalDuration').textContent = t.modalDuration.replace('{duration}', currentService.duration);
    }
    renderSlots();
}

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(currentLang);
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
let schedulesCollection;
function getSchedulesCollection() {
    return collection(db, `artifacts/${appId}/users/${userId}/schedules`);
}

// Modal functions
function openModal(modalId, service) {
    const modal = document.getElementById(modalId);
    if (service) {
        currentService = service;
        const t = translations[currentLang];
        document.getElementById('modalDuration').textContent = t.modalDuration.replace('{duration}', service.duration);
    }
    modal.classList.add('is-visible');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('is-visible');
}

// Event Listeners for services
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const service = {
            type: e.currentTarget.dataset.service,
            duration: e.currentTarget.dataset.duration
        };
        openModal('bookingModal', service);
    });
});

// Fetch and render available slots
function startListeners() {
    const q = query(getSchedulesCollection(), where("isBooked", "==", false));
    onSnapshot(q, (snapshot) => {
        availableSlots = [];
        snapshot.forEach((doc) => {
            availableSlots.push({ id: doc.id, ...doc.data() });
        });
        renderSlots();
    }, (error) => {
        console.error("Error listening to schedules:", error);
    });
}

function renderSlots() {
    appointmentSlotSelect.innerHTML = '';
    const t = translations[currentLang];

    if (availableSlots.length === 0) {
        const option = document.createElement('option');
        option.textContent = t.noSlots;
        option.disabled = true;
        appointmentSlotSelect.appendChild(option);
        return;
    }

    availableSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    availableSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        const serviceName = t[`${slot.service}Consultation`];
        const date = new Date(slot.startTime).toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'full', timeStyle: 'short' });
        option.textContent = `${serviceName} - ${date}`;
        appointmentSlotSelect.appendChild(option);
    });
}

// Booking form submission
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const projectDetails = document.getElementById('projectDetails').value;
    selectedSlotId = appointmentSlotSelect.value;
    
    if (!clientName || !clientEmail || !selectedSlotId) {
        const t = translations[currentLang];
        document.getElementById('errorMessage').textContent = t.errorMessage;
        openModal('errorModal');
        return;
    }

    const docRef = doc(getSchedulesCollection(), selectedSlotId);
    const googleMeetLink = 'https://meet.google.com/your-dynamic-link-here'; // This should be generated by a backend
    
    const bookedData = {
        isBooked: true,
        clientName: clientName,
        clientEmail: clientEmail,
        projectDetails: projectDetails,
        googleMeetLink: googleMeetLink
    };

    try {
        await updateDoc(docRef, bookedData);
        closeModal('bookingModal');
        openModal('confirmationModal');
        googleMeetLinkBtn.href = googleMeetLink;

        const t = translations[currentLang];
        // Send email using EmailJS
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        const emailParams = {
            to_email: clientEmail,
            from_name: 'العنود خوج',
            message: t.successBooking,
            link: googleMeetLink
        };
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams).then(
            (response) => {
                console.log('SUCCESS!', response.status, response.text);
            },
            (error) => {
                console.log('FAILED...', error);
            }
        );
    } catch (error) {
        console.error("Error booking appointment:", error);
        document.getElementById('errorMessage').textContent = 'An error occurred during booking. Please try again.';
        openModal('errorModal');
    }
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setLanguage(currentLang);
});
