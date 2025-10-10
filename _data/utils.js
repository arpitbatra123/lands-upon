const fs = require('fs').promises,
    path = require('path'),
    got = require('got');

// Cache file path
const CACHE_FILE = path.resolve('_data/.geocoding-cache.json');

// In-memory cache for this build session
let memoryCache = new Map();
let cacheSaved = false;

// Load cache from disk on startup
async function loadCache() {
    try {
        const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
        const diskCache = JSON.parse(cacheData);
        memoryCache = new Map(Object.entries(diskCache));
        console.log(`Loaded ${memoryCache.size} geocoding entries from cache`);
    } catch (error) {
        console.log('No existing cache found, starting fresh');
        memoryCache = new Map();
    }
}

// Save cache to disk (only once per process)
async function saveCache() {
    if (cacheSaved) {
        return; // Already saved in this process
    }
    
    try {
        const cacheDir = path.dirname(CACHE_FILE);
        await fs.mkdir(cacheDir, { recursive: true });
        
        const cacheObject = Object.fromEntries(memoryCache);
        await fs.writeFile(CACHE_FILE, JSON.stringify(cacheObject, null, 2));
        console.log(`Saved ${memoryCache.size} geocoding entries to cache`);
        cacheSaved = true;
    } catch (error) {
        console.error('Failed to save cache:', error);
    }
}

// Get cache key for coordinates
function getCacheKey(latitude, longitude) {
    // Round to 4 decimal places to group nearby coordinates
    const lat = Math.round(latitude * 10000) / 10000;
    const lng = Math.round(longitude * 10000) / 10000;
    return `${lat},${lng}`;
}

// Cached geocoding function
async function getLocationName(gps) {
    const cacheKey = getCacheKey(gps.latitude, gps.longitude);
    
    // Check memory cache first
    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
    }
    
    // Make API call
    try {
        const response = await got(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${gps.longitude},${gps.latitude}.json?access_token=pk.eyJ1IjoiYXJwaXRiYXRyYTEyMyIsImEiOiJja2Q2N3ViMGkwbzgzMnFuem55NG10OHNqIn0.zoeIkNpnI16a6Vz69A1UCA`
        ).json();
        
        const locationName = response.features[1].place_name;
        
        // Cache the result
        memoryCache.set(cacheKey, locationName);
        
        // Save cache immediately when new entries are added
        await saveCache();
        
        return locationName;
    } catch (error) {
        console.error(`Geocoding failed for ${gps.latitude}, ${gps.longitude}:`, error.message);
        return 'Unknown Location';
    }
}

// https://stackoverflow.com/questions/1140189/converting-latitude-and-longitude-to-decimal-values
function ConvertDMSToDD(direction, degrees, minutes, seconds) {
    var dd = degrees + minutes / 60 + seconds / (60 * 60);

    if (direction == 'S' || direction == 'W') {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

function processLocationInfo(file, tags) {
    if (!tags || !tags.gps || !tags.gps.GPSLatitudeRef) {
        console.log(`${file} has no gps info available`);
        return;
    }

    const gps = {
        latitude: ConvertDMSToDD(tags.gps.GPSLatitudeRef, ...tags.gps.GPSLatitude),
        longitude: ConvertDMSToDD(tags.gps.GPSLongitudeRef, ...tags.gps.GPSLongitude)
    };

    return gps;
}

// Generate Mapbox static image URL
function getMapboxImageUrl(gps) {
    return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/static/${gps.longitude},${gps.latitude},15,0/300x200@2x?access_token=pk.eyJ1IjoiYXJwaXRiYXRyYTEyMyIsImEiOiJja2Q2N3ViMGkwbzgzMnFuem55NG10OHNqIn0.zoeIkNpnI16a6Vz69A1UCA&attribution=false&logo=false`;
}

// Initialize cache on module load
loadCache();

// Save cache when process exits
process.on('exit', () => {
    if (!cacheSaved && memoryCache.size > 0) {
        const cacheObject = Object.fromEntries(memoryCache);
        require('fs').writeFileSync(CACHE_FILE, JSON.stringify(cacheObject, null, 2));
    }
});

process.on('SIGINT', () => {
    if (!cacheSaved && memoryCache.size > 0) {
        const cacheObject = Object.fromEntries(memoryCache);
        require('fs').writeFileSync(CACHE_FILE, JSON.stringify(cacheObject, null, 2));
    }
    process.exit(0);
});

module.exports = {
    getLocationName,
    ConvertDMSToDD,
    processLocationInfo,
    getMapboxImageUrl,
    saveCache,
    loadCache
};
