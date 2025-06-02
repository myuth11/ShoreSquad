// ShoreSquad Main Application JavaScript

// Global variables for auto-refresh
let weatherRefreshInterval;
const WEATHER_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

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
    
    // Start auto-refresh for weather
    startWeatherAutoRefresh();
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
                title: 'Weekend Beach Sweep',
                date: '2025-06-15',
                location: 'Sunset Beach',
                participants: 24,
                description: 'Join us for a morning cleanup at Sunset Beach'
            },
            {
                title: 'Community Coastal Cleanup',
                date: '2025-06-22',
                location: 'Harbor Point',
                participants: 18,
                description: 'Monthly community cleanup event at Harbor Point'
            }
        ];

        eventsGrid.innerHTML = sampleEvents.map((event, index) => `
            <div class="event-card" style="animation-delay: ${index * 0.1}s;">
                <h3>${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <p><i class="far fa-calendar"></i> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                <p><i class="fas fa-users"></i> ${event.participants} participants</p>
                <button class="join-button" onclick="joinEvent('${event.title}')">
                    <i class="fas fa-hand-paper"></i> Join Event
                </button>
            </div>
        `).join('');
    }, 800);
}

// Event joining functionality
function joinEvent(eventTitle) {
    // Show a confirmation message (in a real app, this would register the user)
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-check"></i> Joined!';
    button.style.backgroundColor = '#27ae60';
    button.disabled = true;
    
    // Show a temporary notification
    showNotification(`Successfully joined: ${eventTitle}`, 'success');
    
    // Reset button after 3 seconds (for demo purposes)
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
    }, 3000);
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
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
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
