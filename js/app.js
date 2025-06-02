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
        // Show loading state with spinner
        weatherWidget.innerHTML = `
            <div class="weather-info" style="text-align: center;">
                <div class="loading-spinner"></div>
                <p>Loading latest weather data...</p>
                <p class="weather-note">(All temperatures in °C)</p>
            </div>
        `;

        // Fetch 4-day forecast from data.gov.sg
        const response = await fetch('https://api.data.gov.sg/v1/environment/4-day-weather-forecast');
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
                        <p class="forecast">${forecast.forecast}</p>
                        <p class="temp">
                            <span class="high">${forecast.temperature.high}°C</span> / 
                            <span class="low">${forecast.temperature.low}°C</span>
                        </p>
                        <p class="humidity">Humidity: ${forecast.relative_humidity.high}% - ${forecast.relative_humidity.low}%</p>
                    </div>
                </div>
            `;
        }).join('');

        weatherWidget.innerHTML = `
            <div class="weather-container">
                <div class="weather-grid">
                    ${forecastHtml}
                </div>
                <p class="weather-note">Data from NEA Singapore</p>
            </div>
        `;    } catch (error) {
        console.error('Weather widget error:', error);
        weatherWidget.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Unable to load weather data</p>
                <p class="weather-note">
                    ${error.message === 'Failed to fetch' 
                        ? 'Network error. Please check your connection.' 
                        : 'Please try again later'}
                </p>
                <button onclick="retryWeatherLoad()" class="cta-button" style="margin-top: 1rem;">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

// Function to retry loading weather data
async function retryWeatherLoad() {
    await initializeWeatherWidget();
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
