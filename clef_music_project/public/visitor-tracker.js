/**
 * Visitor Tracking Script
 * Include this script in your website to automatically track visitors
 * and send notifications to their email/ID
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        apiUrl: 'http://localhost:3000/api/visitors', // Update this to your API URL
        trackOnLoad: true,
        trackOnClick: false,
        trackOnScroll: false
    };

    // Get visitor information
    function getVisitorInfo() {
        return {
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };
    }

    // Get stored user info from localStorage or cookies
    function getUserInfo() {
        // Check localStorage for user info
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch (e) {
                console.error('Error parsing user info from localStorage:', e);
            }
        }

        // Check cookies for user info
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'userInfo') {
                try {
                    return JSON.parse(decodeURIComponent(value));
                } catch (e) {
                    console.error('Error parsing user info from cookie:', e);
                }
            }
        }

        return null;
    }

    // Track visitor
    function trackVisitor(userInfo = null) {
        const visitorData = getVisitorInfo();
        
        if (userInfo) {
            visitorData.userId = userInfo.userId;
            visitorData.email = userInfo.email;
        }

        // Send tracking data to API
        fetch(config.apiUrl + '/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitorData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Visitor tracked successfully:', data);
            
            // Show notification to user
            if (data.notificationSent) {
                showWelcomeNotification();
            }
        })
        .catch(error => {
            console.error('Error tracking visitor:', error);
        });
    }

    // Show welcome notification to user
    function showWelcomeNotification() {
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'visitor-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>Welcome!</strong><br>
                    Thank you for visiting our website. Check your email for special offers!
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px; padding: 0;">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Initialize tracking
    function init() {
        if (config.trackOnLoad) {
            const userInfo = getUserInfo();
            trackVisitor(userInfo);
        }

        // Track on click events (optional)
        if (config.trackOnClick) {
            document.addEventListener('click', function(e) {
                // Only track clicks on specific elements (e.g., buttons, links)
                if (e.target.matches('button, a, .trackable')) {
                    const userInfo = getUserInfo();
                    trackVisitor(userInfo);
                }
            });
        }

        // Track on scroll events (optional)
        if (config.trackOnScroll) {
            let scrollTracked = false;
            window.addEventListener('scroll', function() {
                if (!scrollTracked && window.scrollY > 100) {
                    scrollTracked = true;
                    const userInfo = getUserInfo();
                    trackVisitor(userInfo);
                }
            });
        }
    }

    // Utility functions for external use
    window.VisitorTracker = {
        track: trackVisitor,
        setUserInfo: function(userInfo) {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(userInfo))}; path=/; max-age=31536000`; // 1 year
        },
        clearUserInfo: function() {
            localStorage.removeItem('userInfo');
            document.cookie = 'userInfo=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        },
        config: config
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
