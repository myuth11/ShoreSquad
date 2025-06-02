// ShoreSquad Main Application JavaScript

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize components
    await Promise.all([
        initializeWeatherWidget(),
        initializeMap(),
        loadEvents()
    ]);
}

// Weather Widget
async function initializeWeatherWidget() {
    const weatherWidget = document.querySelector('.weather-widget');
    try {
        // TODO: Implement weather API integration
        // This is a placeholder structure that ensures we use Celsius
        weatherWidget.innerHTML = `
            <div class="weather-info">
                <p>Loading weather data...</p>
                <p class="weather-note">(All temperatures in °C)</p>
            </div>
        `;
    } catch (error) {
        weatherWidget.innerHTML = `
            <div class="weather-error">
                <p>Unable to load weather data</p>
            </div>
        `;
    }
}

// Map Implementation
function initializeMap() {
    const mapContainer = document.getElementById('map-container');
    // TODO: Implement map integration (Google Maps or Leaflet.js)
    mapContainer.innerHTML = `
        <div class="map-loading">
            <p>Loading map...</p>
        </div>
    `;
}

// Events Loading
function loadEvents() {
    const eventsGrid = document.querySelector('.events-grid');
    // Sample events data - will be replaced with API calls
    const sampleEvents = [
        {
            title: 'Weekend Beach Sweep',
            date: '2025-06-15',
            location: 'Sunset Beach',
            participants: 24
        },
        {
            title: 'Community Coastal Cleanup',
            date: '2025-06-22',
            location: 'Harbor Point',
            participants: 18
        }
    ];

    eventsGrid.innerHTML = sampleEvents.map(event => `
        <div class="event-card">
            <h3>${event.title}</h3>
            <p><i class="far fa-calendar"></i> ${event.date}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            <p><i class="fas fa-users"></i> ${event.participants} participants</p>
            <button class="join-button">Join Event</button>
        </div>
    `).join('');
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
