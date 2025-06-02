// ShoreSquad Main Application JavaScript

// Global variables for auto-refresh
let weatherRefreshInterval;
const WEATHER_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Local Storage Keys
const STORAGE_KEYS = {
    THEME: 'shoresquad_theme',
    USER_EVENTS: 'shoresquad_user_events',
    USER_PHOTOS: 'shoresquad_user_photos',
    USER_PREFERENCES: 'shoresquad_preferences'
};

// Global state
let userEvents = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_EVENTS)) || [];
let userPhotos = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PHOTOS)) || [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize theme
    initializeTheme();
    
    // Initialize components
    await Promise.all([
        initializeWeatherWidget(),
        initializeMap(),
        loadEvents()
    ]);
    
    // Start auto-refresh for weather
    startWeatherAutoRefresh();
    
    // Initialize hero animations
    initializeHeroAnimations();
    
    // Initialize event listeners
    initializeEventListeners();
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    updateThemeIcon(newTheme);
    
    showNotification(`Switched to ${newTheme} mode`, 'success');
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Hero Animations
function initializeHeroAnimations() {
    // Animate counter numbers
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        animateCounter(counter, target);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 20);
}

// Navigation functions
function scrollToEvents() {
    document.getElementById('events').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Event Listeners
function initializeEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Create event button
    document.getElementById('create-event-btn').addEventListener('click', openEventModal);
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => filterEvents(e.target.dataset.filter));
    });
    
    // Modal close on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeEventModal();
            closePhotoModal();
        }
    });
}

// Weather Widget
async function initializeWeatherWidget() {
    const weatherWidget = document.querySelector('.weather-widget');
    try {
        // Show loading state with spinner
        weatherWidget.innerHTML = `
            <div class="weather-info" style="text-align: center;">
                <div class="loading-spinner"></div>
                <p>Loading latest weather data...</p>
                <p class="weather-note">(All temperatures in °C)</p>
            </div>
        `;        // Fetch 4-day forecast from data.gov.sg with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('https://api.data.gov.sg/v1/environment/4-day-weather-forecast', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || !data.items[0] || !data.items[0].forecasts) {
            throw new Error('Invalid data format');
        }

        const forecasts = data.items[0].forecasts;
        const today = new Date();        // Add loading complete message to console
        console.info('Weather data loaded successfully');

        const forecastHtml = forecasts.map(forecast => {
            const date = new Date(forecast.date);
            const isToday = date.toDateString() === today.toDateString();
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
            
            // Format date for better accessibility
            const formattedDate = new Intl.DateTimeFormat('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).format(date);
            
            return `                <div class="weather-day ${isToday ? 'weather-today' : ''}" 
                    aria-label="Weather forecast for ${formattedDate}">
                    <h3>${isToday ? 'Today' : dayName}</h3>
                    <div class="weather-icon" role="img" aria-label="${forecast.forecast}">
                        <i class="fas ${getWeatherIcon(forecast.forecast)}"></i>
                    </div>
                    <div class="weather-details">
                        <p class="forecast">${forecast.forecast}</p>                        <p class="temp">
                            <span class="high">${forecast.temperature.high}°C</span> / 
                            <span class="low">${forecast.temperature.low}°C</span>
                        </p>
                        <p class="humidity">
                            <i class="fas fa-tint" style="margin-right: 0.3rem;"></i>
                            ${forecast.relative_humidity.high}% - ${forecast.relative_humidity.low}%
                        </p>
                        ${forecast.wind ? `
                            <p class="wind" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.3rem;">
                                <i class="fas fa-wind" style="margin-right: 0.3rem;"></i>
                                ${forecast.wind.speed_kmh ? forecast.wind.speed_kmh + ' km/h' : 'Variable'}
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');        weatherWidget.innerHTML = `
            <div class="weather-container">
                <div class="weather-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: var(--text);">4-Day Forecast</h3>
                    <div class="weather-controls">
                        <span class="last-updated" style="font-size: 0.8rem; opacity: 0.7;">
                            Updated: ${new Date().toLocaleTimeString()}
                        </span>
                        <button onclick="manualWeatherRefresh()" class="refresh-btn" 
                                style="background: none; border: none; color: var(--primary); margin-left: 0.5rem; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="weather-grid">
                    ${forecastHtml}
                </div>
                <p class="weather-note">Data from NEA Singapore • Auto-refreshes every 10 minutes</p>
            </div>
        `;    } catch (error) {
        console.error('Weather widget error:', error);
        
        let errorMessage = 'Unable to load weather data';
        let errorDetails = 'Please try again later';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out';
            errorDetails = 'The weather service is taking too long to respond';
        } else if (error.message.includes('HTTP 429')) {
            errorMessage = 'Rate limit exceeded';
            errorDetails = 'Too many requests. Please wait a moment before trying again';
        } else if (error.message.includes('HTTP')) {
            errorMessage = 'Service unavailable';
            errorDetails = error.message;
        } else if (error.message === 'Failed to fetch') {
            errorMessage = 'Network error';
            errorDetails = 'Please check your internet connection';
        }
        
        weatherWidget.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-circle error-icon" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${errorMessage}</p>
                <p class="weather-note">${errorDetails}</p>
                <div style="margin-top: 1rem;">
                    <button onclick="retryWeatherLoad()" class="cta-button" style="margin-right: 0.5rem;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                    <button onclick="toggleAutoRefresh()" class="cta-button" 
                            style="background-color: var(--accent); color: var(--text);">
                        <i class="fas fa-pause"></i> Stop Auto-refresh
                    </button>
                </div>
            </div>
        `;
    }
}

// Function to retry loading weather data
async function retryWeatherLoad() {
    await initializeWeatherWidget();
}

// Auto-refresh functionality
function startWeatherAutoRefresh() {
    // Clear any existing interval
    if (weatherRefreshInterval) {
        clearInterval(weatherRefreshInterval);
    }
    
    weatherRefreshInterval = setInterval(async () => {
        console.log('Auto-refreshing weather data...');
        const refreshBtn = document.querySelector('.refresh-btn i');
        if (refreshBtn) {
            refreshBtn.classList.add('refresh-indicator');
        }
        
        await initializeWeatherWidget();
        
        if (refreshBtn) {
            refreshBtn.classList.remove('refresh-indicator');
        }
    }, WEATHER_REFRESH_INTERVAL);
}

function stopWeatherAutoRefresh() {
    if (weatherRefreshInterval) {
        clearInterval(weatherRefreshInterval);
        weatherRefreshInterval = null;
    }
}

function toggleAutoRefresh() {
    if (weatherRefreshInterval) {
        stopWeatherAutoRefresh();
        console.log('Auto-refresh stopped');
    } else {
        startWeatherAutoRefresh();
        console.log('Auto-refresh started');
    }
}

async function manualWeatherRefresh() {
    const refreshBtn = document.querySelector('.refresh-btn i');
    if (refreshBtn) {
        refreshBtn.style.animation = 'spin 1s linear infinite';
    }
    
    await initializeWeatherWidget();
    
    if (refreshBtn) {
        refreshBtn.style.animation = '';
    }
}

// Helper function to map weather conditions to Font Awesome icons
function getWeatherIcon(forecast) {
    const condition = forecast.toLowerCase();
    if (condition.includes('thundery') || condition.includes('thunder')) {
        return 'fa-bolt';
    } else if (condition.includes('rain') || condition.includes('showers')) {
        return 'fa-cloud-rain';
    } else if (condition.includes('cloudy')) {
        return 'fa-cloud';
    } else if (condition.includes('sunny') || condition.includes('fair')) {
        return 'fa-sun';    } else {
        return 'fa-cloud-sun'; // default icon
    }
}

// Map Implementation
function initializeMap() {
    const mapContainer = document.getElementById('map-container');
    
    // Show loading state initially
    mapContainer.innerHTML = `
        <div class="map-loading">
            <div class="loading-spinner"></div>
            <p>Loading interactive map...</p>
        </div>
    `;
    
    // Simulate map loading delay to show loading state, then load the actual map
    setTimeout(() => {
        mapContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="450" 
                frameborder="0" 
                scrolling="no" 
                marginheight="0" 
                marginwidth="0" 
                src="https://www.openstreetmap.org/export/embed.html?bbox=103.94557237625123%2C1.3714970183098553%2C103.96557378768922%2C1.3914970183098553&amp;layer=mapnik&amp;marker=1.381497%2C103.955574"
                style="border: 1px solid #ccc">
            </iframe>
            <br/>
            <small>
                <a href="https://www.openstreetmap.org/?mlat=1.381497&amp;mlon=103.955574#map=16/1.381497/103.955574" target="_blank">
                    <i class="fas fa-external-link-alt"></i> View Larger Map
                </a>
            </small>
        `;
    }, 1000); // 1 second delay to show loading animation
}

// Events Loading
function loadEvents() {
    const eventsGrid = document.querySelector('.events-grid');
    
    // Show loading skeleton
    eventsGrid.innerHTML = `
        <div class="event-card-loading">
            <div class="loading-skeleton" style="height: 24px; margin-bottom: 0.8rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 0.5rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 0.5rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 1rem;"></div>
            <div class="loading-skeleton" style="height: 40px; width: 120px;"></div>
        </div>
        <div class="event-card-loading">
            <div class="loading-skeleton" style="height: 24px; margin-bottom: 0.8rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 0.5rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 0.5rem;"></div>
            <div class="loading-skeleton" style="height: 16px; margin-bottom: 1rem;"></div>
            <div class="loading-skeleton" style="height: 40px; width: 120px;"></div>
        </div>
    `;
    
    // Simulate loading delay and then show actual events
    setTimeout(() => {
        // Sample events data - will be replaced with API calls
        const sampleEvents = [
            {
                id: 'sample-1',
                title: 'Weekend Beach Sweep',
                date: '2025-06-15',
                time: '09:00',
                location: 'Sunset Beach',
                participants: 24,
                capacity: 50,
                description: 'Join us for a morning cleanup at Sunset Beach',
                type: 'beach',
                photo: null
            },
            {
                id: 'sample-2',
                title: 'Community Coastal Cleanup',
                date: '2025-06-22',
                time: '08:00',
                location: 'Harbor Point',
                participants: 18,
                capacity: 40,
                description: 'Monthly community cleanup event at Harbor Point',
                type: 'beach',
                photo: null
            }
        ];

        // Combine sample events with user-created events
        const allEvents = [...sampleEvents, ...userEvents];
        renderEvents(allEvents);
    }, 800);
}

function renderEvents(events) {
    const eventsGrid = document.querySelector('.events-grid');
    
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-plus" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <h3>No events found</h3>
                <p>Be the first to create an event!</p>
                <button class="cta-button primary" onclick="openEventModal()">
                    <i class="fas fa-plus"></i> Create Event
                </button>
            </div>
        `;
        return;
    }

    eventsGrid.innerHTML = events.map((event, index) => `
        <div class="event-card" data-type="${event.type}" style="animation-delay: ${index * 0.1}s;">
            ${event.photo ? `<div class="event-photo">
                <img src="${event.photo}" alt="${event.title}" onclick="openPhotoModal('${event.id}')">
            </div>` : ''}
            <div class="event-type-badge">${getEventTypeLabel(event.type)}</div>
            <h3>${event.title}</h3>
            <p class="event-description">${event.description}</p>
            <p><i class="far fa-calendar"></i> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><i class="far fa-clock"></i> ${event.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            <p><i class="fas fa-users"></i> ${event.participants}/${event.capacity} participants</p>
            <div class="event-actions">
                <button class="join-button" onclick="joinEvent('${event.id}', '${event.title}')">
                    <i class="fas fa-hand-paper"></i> Join Event
                </button>
                <button class="photo-button" onclick="openPhotoModal('${event.id}')">
                    <i class="fas fa-camera"></i> Photos
                </button>
            </div>
        </div>
    `).join('');
}

function getEventTypeLabel(type) {
    const types = {
        beach: 'Beach Cleanup',
        river: 'River Cleanup',
        park: 'Park Cleanup',
        other: 'Community Event'
    };
    return types[type] || 'Event';
}

function filterEvents(filterType) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
    
    // Filter and display events
    const sampleEvents = [
        {
            id: 'sample-1',
            title: 'Weekend Beach Sweep',
            date: '2025-06-15',
            time: '09:00',
            location: 'Sunset Beach',
            participants: 24,
            capacity: 50,
            description: 'Join us for a morning cleanup at Sunset Beach',
            type: 'beach',
            photo: null
        },
        {
            id: 'sample-2',
            title: 'Community Coastal Cleanup',
            date: '2025-06-22',
            time: '08:00',
            location: 'Harbor Point',
            participants: 18,
            capacity: 40,
            description: 'Monthly community cleanup event at Harbor Point',
            type: 'beach',
            photo: null
        }
    ];
    
    const allEvents = [...sampleEvents, ...userEvents];
    const filteredEvents = filterType === 'all' ? allEvents : allEvents.filter(event => event.type === filterType);
    renderEvents(filteredEvents);
}

// Event joining functionality
function joinEvent(eventId, eventTitle) {
    const button = event.target;
    const originalText = button.innerHTML;
    
    // Check if user already joined
    const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
    if (joinedEvents.includes(eventId)) {
        showNotification('You have already joined this event!', 'info');
        return;
    }
    
    // Add visual feedback
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Update local storage
        joinedEvents.push(eventId);
        localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));
        
        // Update button state
        button.innerHTML = '<i class="fas fa-check"></i> Joined!';
        button.style.backgroundColor = '#27ae60';
        
        // Show success notification
        showNotification(`Successfully joined: ${eventTitle}`, 'success');
        
        // Update participant count if it's a user-created event
        const userEventIndex = userEvents.findIndex(e => e.id === eventId);
        if (userEventIndex !== -1) {
            userEvents[userEventIndex].participants++;
            localStorage.setItem(STORAGE_KEYS.USER_EVENTS, JSON.stringify(userEvents));
        }
        
        // Reset button after 3 seconds (for demo purposes)
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-user-check"></i> Joined';
            button.disabled = true;
        }, 3000);
    }, 1000);
}

// Event Modal Functions
function openEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('event-date').min = today;
    
    // Reset form
    document.getElementById('event-form').reset();
    document.getElementById('photo-preview').innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Click to upload photo</span>
    `;
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function submitEvent(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventData = {
        id: 'user-' + Date.now(),
        title: formData.get('title'),
        type: formData.get('type'),
        date: formData.get('date'),
        time: formData.get('time'),
        location: formData.get('location'),
        description: formData.get('description'),
        capacity: parseInt(formData.get('capacity')),
        participants: 0,
        photo: null,
        createdBy: 'user',
        createdAt: new Date().toISOString()
    };
    
    // Handle photo if uploaded
    const photoFile = formData.get('photo');
    if (photoFile && photoFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            eventData.photo = e.target.result;
            saveAndDisplayEvent(eventData);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveAndDisplayEvent(eventData);
    }
}

function saveAndDisplayEvent(eventData) {
    // Add to user events
    userEvents.push(eventData);
    localStorage.setItem(STORAGE_KEYS.USER_EVENTS, JSON.stringify(userEvents));
    
    // Close modal
    closeEventModal();
    
    // Show success notification
    showNotification(`Event "${eventData.title}" created successfully!`, 'success');
    
    // Refresh events display
    loadEvents();
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photo-preview').innerHTML = `
                <img src="${e.target.result}" alt="Event preview">
                <span>Click to change photo</span>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Photo Modal Functions
function openPhotoModal(eventId) {
    const modal = document.getElementById('photo-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Load photos for this event
    loadEventPhotos(eventId);
}

function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function loadEventPhotos(eventId) {
    const gallery = document.getElementById('photo-gallery');
    const eventPhotos = userPhotos.filter(photo => photo.eventId === eventId);
    
    if (eventPhotos.length === 0) {
        gallery.innerHTML = `
            <div class="no-photos">
                <i class="fas fa-camera" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <h3>No photos yet</h3>
                <p>Be the first to share photos from this event!</p>
            </div>
        `;
    } else {
        gallery.innerHTML = eventPhotos.map(photo => `
            <img src="${photo.url}" alt="Event photo" onclick="viewFullPhoto('${photo.url}')">
        `).join('');
    }
    
    // Store current event ID for photo uploads
    gallery.dataset.eventId = eventId;
}

function uploadPhotos(event) {
    const files = Array.from(event.target.files);
    const eventId = document.getElementById('photo-gallery').dataset.eventId;
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoData = {
                    id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    eventId: eventId,
                    url: e.target.result,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'user'
                };
                
                userPhotos.push(photoData);
                localStorage.setItem(STORAGE_KEYS.USER_PHOTOS, JSON.stringify(userPhotos));
                
                // Refresh photo display
                loadEventPhotos(eventId);
            };
            reader.readAsDataURL(file);
        }
    });
    
    showNotification('Photos uploaded successfully!', 'success');
}

function viewFullPhoto(photoUrl) {
    // Create full-screen photo viewer
    const viewer = document.createElement('div');
    viewer.className = 'photo-viewer';
    viewer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        cursor: pointer;
    `;
    
    viewer.innerHTML = `
        <img src="${photoUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
        <button style="position: absolute; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add fadeOut animation to CSS dynamically
if (!document.querySelector('#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}

// Add enhanced dynamic styles
if (!document.querySelector('#enhanced-dynamic-styles')) {
    const enhancedStyle = document.createElement('style');
    enhancedStyle.id = 'enhanced-dynamic-styles';
    enhancedStyle.textContent = `
        .no-events, .no-photos {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text);
            grid-column: 1 / -1;
        }
        
        .event-photo {
            width: 100%;
            height: 200px;
            overflow: hidden;
            border-radius: 8px;
            margin-bottom: 1rem;
            cursor: pointer;
        }
        
        .event-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .event-photo img:hover {
            transform: scale(1.05);
        }
        
        .event-type-badge {
            background: var(--primary);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 1rem;
            display: inline-block;
        }
        
        .event-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .event-actions button {
            flex: 1;
            padding: 0.6rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.3rem;
            font-size: 0.9rem;
        }
        
        .photo-button {
            background: var(--accent) !important;
            color: var(--text) !important;
        }
        
        .photo-button:hover {
            background: #f1c40f !important;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(enhancedStyle);
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
