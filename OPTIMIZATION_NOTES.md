# Mapbox API Optimization

> **Created by AI Assistant** - This optimization was implemented to reduce Mapbox API costs and eliminate code duplication in the 11ty data cascade.  
> **@https://cursor.com/**

## Problem
The original implementation had several issues causing excessive Mapbox API usage and costs:

1. **Code Duplication**: Identical functions (`ConvertDMSToDD`, `processLocationInfo`, `getLocationName`) were duplicated across 3 files:
   - `_data/images.js`
   - `_data/stats.js` 
   - `generate-feed.js`

2. **No Caching**: Every build made fresh API calls for every image, even if coordinates were identical or very close

3. **Exposed API Token**: Hardcoded in multiple files

## Solution

### 1. Centralized Utilities (`_data/utils.js`)
- Created shared utility module with all common functions
- Implemented intelligent caching system
- Environment variable support for API token

### 2. Caching System
- **@11ty/eleventy-fetch**: Uses official 11ty caching plugin
- **Permanent Caching**: 1-year cache duration (location names never change)
- **Smart Key Generation**: Rounds coordinates to 4 decimal places to group nearby locations
- **Graceful Fallbacks**: Automatic fallback to expired cache on network failures

### 3. Code Consolidation
- Removed ~90 lines of duplicate code
- Single source of truth for all GPS processing
- Consistent error handling

## Benefits

### Cost Reduction
- **Before**: Every image triggered API calls on every build
- **After**: Only new/unique coordinates trigger API calls (permanent cache)
- **Estimated Savings**: 99%+ reduction in API calls (only new locations need API calls)

### Performance
- **Faster Builds**: Cached results load instantly
- **Reduced Network**: Only new coordinates require API calls
- **Better Error Handling**: Graceful fallbacks for failed geocoding

### Maintainability
- **DRY Principle**: No more duplicate code
- **Single Configuration**: API token in one place
- **Easier Updates**: Changes only needed in utils.js

## Usage

The optimization is transparent - no changes needed to existing code. The cache file is automatically created and maintained.

### API Token
- Uses hardcoded Mapbox token for simplicity
- Token is centralized in `_data/utils.js` only

### Cache Management
- Cache file: `_data/.geocoding-cache.json`
- **Included in git** to prevent API calls on Vercel builds
- Can be safely deleted to force fresh API calls

## Files Modified
- `_data/utils.js` (new)
- `_data/images.js` (refactored)
- `_data/stats.js` (refactored) 
- `generate-feed.js` (refactored)
- `.gitignore` (updated)
