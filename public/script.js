    // ============================
    // CONTACT FORM - SAVE FEEDBACK TO PROFILE
    // Must be loaded AFTER auth.js
    // ============================

    document.addEventListener('DOMContentLoaded', function() {
        const contactForm = document.getElementById('contactForm');
        
        if (contactForm) {
            console.log('Contact form found, setting up handler');
            
            // Remove any existing handlers
            contactForm.onsubmit = null;
            
            // Add new submit handler
            contactForm.addEventListener('submit', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                console.log('Form submitted');
                
                // Clear previous errors
                clearContactFormErrors();
                
                let isValid = true;
                
                // Get form values
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const subject = document.getElementById('subject').value;
                const message = document.getElementById('message').value.trim();
                
                // Validate Name
                if (name.length < 2) {
                    showContactFieldError('name', 'Name must be at least 2 characters');
                    isValid = false;
                }
                
                // Validate Email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showContactFieldError('email', 'Please enter a valid email address');
                    isValid = false;
                }
                
                // Validate Message
                if (message.length < 10) {
                    showContactFieldError('message', 'Message must be at least 10 characters');
                    isValid = false;
                }
                
                if (isValid) {
                    console.log('Form is valid, processing...');
                    
                    // Show loading state
                    const submitBtn = contactForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
                    
                    // Save feedback to DB (if logged in) and send email
                    setTimeout(async () => {
                        const saved = await saveFeedbackToHistory(name, email, subject, message);
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                        
                        // Show success message
                        showContactSuccess(saved);
                        
                        // Reset form
                        contactForm.reset();
                        
                        // Play sound
                        if (typeof playSuccessSound === 'function') {
                            playSuccessSound();
                        }
                    }, 1500);
                }
            });
        }
    });

    // Save feedback:
    // - if logged in -> store in MongoDB (/api/feedback)
    // - always try to send email (/api/contact/send)
    async function saveFeedbackToHistory(name, email, subject, message) {
        const token = localStorage.getItem('token');
        let saved = false;

        // Save to DB for logged in users
        if (token && typeof API !== 'undefined') {
            try {
                await API.request('/api/feedback', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        email,
                        subject: subject || 'General Inquiry',
                        message
                    })
                });
                saved = true;
            } catch (e) {
                // ignore DB save errors, user still sent message
                console.warn('Feedback save failed:', e.message);
            }
        }

        // Send email via backend (no auth required)
        try {
            await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    subject: subject || 'General Inquiry',
                    message
                })
            });
        } catch (e) {
            console.warn('Email send failed:', e.message);
        }

        return saved;
    }

    // Show success message
    function showContactSuccess(saved) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-5';
        successDiv.style.zIndex = '9999';
        successDiv.style.minWidth = '350px';
        
        let message = '<strong><i class="bi bi-check-circle me-2"></i>Success!</strong> Your message has been sent.';
        
        if (saved) {
            message += '<br><small><i class="bi bi-journal-text me-2"></i>Saved to your <a href="profile.html" class="alert-link">profile history</a></small>';
        } else {
            message += '<br><small><i class="bi bi-lightbulb me-2"></i><a href="login.html" class="alert-link">Log in</a> to save feedback history</small>';
        }
        
        successDiv.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => successDiv.remove(), 6000);
    }

    // Helper functions
    function showContactFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const existingError = field.parentElement.querySelector('.invalid-feedback');
        if (existingError) existingError.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.textContent = message;
        
        field.classList.add('is-invalid');
        field.parentElement.appendChild(errorDiv);
    }

    function clearContactFormErrors() {
        document.querySelectorAll('#contactForm .is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        document.querySelectorAll('#contactForm .invalid-feedback').forEach(error => {
            error.remove();
        });
    }

    // ============================
    // OTHER FEATURES
    // ============================

    // Rating stars
    // ============================
    // RATING STARS - ONLY FOR MENU PAGE
    // ============================

    document.addEventListener('DOMContentLoaded', function() {
        // Only add stars on menu page
        if (!window.location.pathname.includes('menu.html')) {
            return; // Exit if not on menu page
        }
        
        const orderButtons = document.querySelectorAll('.btn-outline-primary');
        
        orderButtons.forEach((button) => {
            // Only add stars to "Order Now" buttons
            if (!button.textContent.includes('Order Now')) {
                return; // Skip this button
            }
            
            const starsContainer = document.createElement('div');
            starsContainer.className = 'rating-stars mt-2';
            starsContainer.innerHTML = `
                <span class="star" data-rating="1">⭐</span>
                <span class="star" data-rating="2">⭐</span>
                <span class="star" data-rating="3">⭐</span>
                <span class="star" data-rating="4">⭐</span>
                <span class="star" data-rating="5">⭐</span>
            `;
            
            button.parentElement.insertBefore(starsContainer, button.nextSibling);
            
            const stars = starsContainer.querySelectorAll('.star');
            stars.forEach(star => {
                star.style.cursor = 'pointer';
                star.style.opacity = '0.3';
                star.style.transition = 'all 0.3s ease';
                
                star.addEventListener('click', function() {
                    const rating = this.getAttribute('data-rating');
                    stars.forEach((s, i) => {
                        s.style.opacity = i < rating ? '1' : '0.3';
                        s.style.transform = i < rating ? 'scale(1.2)' : 'scale(1)';
                    });
                    
                    // Show rating message
                    showRatingMessage(rating);
                });
                
                star.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.3)';
                });
                
                star.addEventListener('mouseleave', function() {
                    if (this.style.opacity !== '1') {
                        this.style.transform = 'scale(1)';
                    }
                });
            });
        });
    });

    // Function to show rating message
    function showRatingMessage(rating) {
        const existingMessage = document.querySelector('#ratingMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const message = document.createElement('div');
        message.id = 'ratingMessage';
        message.className = 'alert alert-success mt-3';
        message.textContent = `You rated this ${rating} stars! Thank you for your feedback.`;
        
        const container = document.querySelector('.container.my-5');
        if (container) {
            container.appendChild(message);
            
            setTimeout(() => {
                message.remove();
            }, 3000);
        }
    }

    // Dark mode toggle
    document.addEventListener('DOMContentLoaded', function() {
        const colorChangeBtn = document.getElementById('colorChangeBtn');
        const body = document.body;

        function updateMode(isDark) {
            if (isDark) {
                body.classList.add('dark-mode');
                body.style.backgroundColor = '#121212';
                body.style.color = '#f0f0f0';
                if (colorChangeBtn) {
                    colorChangeBtn.innerHTML = '<i class="bi bi-sun me-2"></i>Light Mode';
                    colorChangeBtn.style.backgroundColor = '#ffc107';
                    colorChangeBtn.style.color = '#000';
                }
                localStorage.setItem('colorMode', 'dark');
            } else {
                body.classList.remove('dark-mode');
                body.style.backgroundColor = '#fefffb';
                body.style.color = '#333';
                if (colorChangeBtn) {
                    colorChangeBtn.innerHTML = '<i class="bi bi-moon-stars me-2"></i>Dark Mode';
                    colorChangeBtn.style.backgroundColor = '';
                    colorChangeBtn.style.color = '';
                }
                localStorage.setItem('colorMode', 'light');
            }
        }
        
        const savedMode = localStorage.getItem('colorMode');
        updateMode(savedMode === 'dark');
        
        if (colorChangeBtn) {
            colorChangeBtn.addEventListener('click', function() {
                updateMode(!body.classList.contains('dark-mode'));
            });
        }
    });

    // Date/Time display
    document.addEventListener('DOMContentLoaded', function() {
        const dateTimeDisplay = document.getElementById('dateTimeDisplay');
        
        if (dateTimeDisplay) {
            function updateDateTime() {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
                
                let hours = now.getHours();
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
                
                dateTimeDisplay.innerHTML = `
                    <div class="date-display">${dateStr}</div>
                    <div class="time-display">${timeStr}</div>
                `;
            }
            
            updateDateTime();
            setInterval(updateDateTime, 1000);
        }
    });

    // Accordion
    document.addEventListener('DOMContentLoaded', function() {
        const accordionItems = document.querySelectorAll('.accordion-item-custom');
        
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header-custom');
            const content = item.querySelector('.accordion-content-custom');
            
            if (header && content) {
                header.addEventListener('click', function() {
                    const isActive = item.classList.contains('active');
                    
                    accordionItems.forEach(i => {
                        i.classList.remove('active');
                        const c = i.querySelector('.accordion-content-custom');
                        if (c) c.style.maxHeight = null;
                    });
                    
                    if (!isActive) {
                        item.classList.add('active');
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                });
            }
        });
    });

    // Subscription popup
    document.addEventListener('DOMContentLoaded', function() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const popup = document.getElementById('subscriptionPopup');
        const closePopup = document.getElementById('closePopup');
        const popupOverlay = document.getElementById('popupOverlay');
        const subscribeForm = document.getElementById('subscribeForm');
        
        if (subscribeBtn && popup) {
            subscribeBtn.addEventListener('click', function() {
                popup.style.display = 'block';
                popupOverlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            });
        }
        
        function closeSubscriptionPopup() {
            if (popup && popupOverlay) {
                popup.style.display = 'none';
                popupOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
        
        if (closePopup) {
            closePopup.addEventListener('click', closeSubscriptionPopup);
        }
        
        if (popupOverlay) {
            popupOverlay.addEventListener('click', closeSubscriptionPopup);
        }
        
        if (subscribeForm) {
            subscribeForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const email = document.getElementById('popupEmail').value;
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (emailPattern.test(email)) {
                    alert('Thank you for subscribing to ' + email);
                    subscribeForm.reset();
                    closeSubscriptionPopup();
                } else {
                    alert('Please enter a valid email');
                }
            });
        }
    });

    // Success sound
    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }