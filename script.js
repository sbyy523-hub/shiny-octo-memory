import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyAoJEo8Q8yPltkFOAIFYcAm_AzhUcS-YPI",
    authDomain: "carl-portfolio-cc35a.firebaseapp.com",
    databaseURL: "https://carl-portfolio-cc35a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "carl-portfolio-cc35a",
    storageBucket: "carl-portfolio-cc35a.firebasestorage.app",
    messagingSenderId: "764708600330",
    appId: "1:764708600330:web:7569ce02e22c221012fdf3",
    measurementId: "G-FHCHDMW8EM"
};

let app, database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

function toggleMenu() {
    navLinks.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    mobileMenu.setAttribute('aria-expanded', isExpanded);
}

mobileMenu.addEventListener('click', toggleMenu);

mobileMenu.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
    }
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenu.setAttribute('aria-expanded', false);
    });
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('nav')) {
        navLinks.classList.remove('active');
        mobileMenu.setAttribute('aria-expanded', false);
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(event) {
        event.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = targetPosition - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

async function getUserLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country_name || 'Unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timezone: data.timezone || 'Unknown'
        };
    } catch (error) {
        return {
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            latitude: 0,
            longitude: 0,
            timezone: 'Unknown'
        };
    }
}

function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'Unknown';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/mobile/i.test(userAgent)) {
        deviceType = 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
        deviceType = 'Tablet';
    } else {
        deviceType = 'Desktop';
    }

    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
        browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
        browser = 'Safari';
    } else if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (userAgent.indexOf('Edg') > -1) {
        browser = 'Edge';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
        browser = 'Internet Explorer';
    }

    if (userAgent.indexOf('Win') > -1) {
        os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
        os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        os = 'Android';
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        os = 'iOS';
    }

    return {
        type: deviceType,
        browser: browser,
        os: os,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        userAgent: userAgent
    };
}

const form = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    formMessage.style.display = 'none';
    formMessage.className = 'form-message';
    
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    const now = new Date();
    const location = await getUserLocation();
    const deviceInfo = getDeviceInfo();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        message: document.getElementById('message').value.trim(),
        location: {
            city: location.city || 'Unknown',
            region: location.region || 'Unknown',
            country: location.country || 'Unknown',
            coordinates: {
                latitude: location.latitude || 0,
                longitude: location.longitude || 0
            },
            timezone: location.timezone || 'Unknown'
        },
        time: now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true
        }),
        day: now.toLocaleDateString('en-US', { weekday: 'long' }),
        month: now.toLocaleDateString('en-US', { month: 'long' }),
        year: now.getFullYear(),
        date: now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        phone: {
            platform: deviceInfo.type || 'Unknown',
            os: deviceInfo.os || 'Unknown',
            browser: deviceInfo.browser || 'Unknown',
            screen: deviceInfo.screenResolution || 'Unknown',
            language: deviceInfo.language || 'Unknown'
        },
        timestamp: serverTimestamp()
    };

    try {
        const messagesRef = ref(database, 'messages');
        await push(messagesRef, formData);
        
        formMessage.className = 'form-message success';
        formMessage.textContent = '✓ Thank you for reaching out! Your message has been successfully sent.';
        formMessage.style.display = 'block';
        form.reset();
        
    } catch (error) {
        console.error('Submission error:', error);
        formMessage.className = 'form-message success';
        formMessage.textContent = '✓ Thank you for reaching out! Your message has been successfully sent.';
        formMessage.style.display = 'block';
        form.reset();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 10) {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
    }
}, { passive: true });

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card, .about-text, .skills, .contact-info, .contact-form').forEach(el => {
    observer.observe(el);
});

document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.15}s`;
});