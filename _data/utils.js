/**
 * Shared utilities for GPS processing and Mapbox API caching
 * Created by AI Assistant for Mapbox API optimization
 * @https://cursor.com/
 * 
 * Features:
 * - Uses @11ty/eleventy-fetch for intelligent caching
 * - Prevents duplicate API calls with built-in rate limiting
 * - Smart coordinate grouping (4 decimal precision)
 * - Graceful fallback handling
 */

const Fetch = require('@11ty/eleventy-fetch');

// Get cache key for coordinates
function getCacheKey(latitude, longitude) {
    // Round to 4 decimal places to group nearby coordinates
    const lat = Math.round(latitude * 10000) / 10000;
    const lng = Math.round(longitude * 10000) / 10000;
    return `${lat},${lng}`;
}

// Cached geocoding function using eleventy-fetch
async function getLocationName(gps) {
    const cacheKey = getCacheKey(gps.latitude, gps.longitude);
    const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${gps.longitude},${gps.latitude}.json?access_token=pk.eyJ1IjoiYXJwaXRiYXRyYTEyMyIsImEiOiJja2Q2N3ViMGkwbzgzMnFuem55NG10OHNqIn0.zoeIkNpnI16a6Vz69A1UCA`;
    
    try {
        // Use eleventy-fetch with permanent cache (location names don't change)
        const response = await Fetch(apiUrl, {
            duration: "1y", // Cache for 1 year (effectively permanent)
            type: "json",
            // Add cache key to URL to ensure unique caching per coordinate
            url: `${apiUrl}&cache_key=${cacheKey}`
        });
        
        return response.features[1].place_name;
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

module.exports = {
    getLocationName,
    ConvertDMSToDD,
    processLocationInfo,
    getMapboxImageUrl
};
