/**
 * Vercel Speed Insights Integration
 * Tracks Core Web Vitals and performance metrics
 */

// Import injectSpeedInsights from the installed package
// Since this is a vanilla JS project, we'll use a dynamic import
(function() {
  'use strict';
  
  // Function to load and inject Speed Insights
  function initSpeedInsights() {
    // Only initialize in production or when deployed to Vercel
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    // Check if Speed Insights script is already loaded
    if (window.speedInsightsLoaded) {
      return;
    }
    
    // Mark as loaded to prevent duplicate initialization
    window.speedInsightsLoaded = true;
    
    // Load Speed Insights from CDN for simplicity in static sites
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@latest/dist/index.mjs';
      
      // Initialize Speed Insights
      injectSpeedInsights({
        debug: ${!isProduction}, // Enable debug mode in development
        framework: 'vanilla',
        sampleRate: 1, // Track 100% of visitors (adjust as needed)
      });
      
      console.log('✓ Vercel Speed Insights initialized');
    `;
    
    document.head.appendChild(script);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpeedInsights);
  } else {
    initSpeedInsights();
  }
})();
