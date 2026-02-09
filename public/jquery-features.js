$(document).ready(function(){
    console.log("jQuery is ready!");
    
    // Initialize all jQuery features
    initializeSearchFeatures();
    initializeUXElements();
    initializeFunctionalityImprovements();
});


// PART 1: jQuery Search
// ============================

function initializeSearchFeatures() {
    // Filters menu items as user types
    // ============================
    
    // Create search bar for menu page
    if ($('.menu-container').length || $('.row.g-4.mb-5').length) {
        const searchHTML = `
            <div class="search-container mb-4">
                <div class="input-group input-group-lg">
                    <span class="input-group-text"><i class="bi bi-search me-2"></i></span>
                    <input type="text" id="menuSearch" class="form-control" 
                           placeholder="Search menu items...">
                </div>
                <p class="text-muted mt-2" id="searchResults"></p>
            </div>
        `;
        
        $('.container.my-5 h1').after(searchHTML);
        
        // Real-time filter on keyup
        $('#menuSearch').on('keyup', function() {
            const searchTerm = $(this).val().toLowerCase();
            let visibleCount = 0;
            
            $('.col-lg-6.col-md-12').filter(function() {
                const cardText = $(this).text().toLowerCase();
                const matches = cardText.indexOf(searchTerm) > -1;
                $(this).toggle(matches);
                if (matches) visibleCount++;
                return true;
            });
            
            // Update results count
            if (searchTerm) {
                $('#searchResults').text(`Found ${visibleCount} item(s)`);
            } else {
                $('#searchResults').text('');
            }
        });
    }
    
    // Create search for gallery page
    if ($('.row.g-4').length && window.location.pathname.includes('gallery.html')) {
        const gallerySearchHTML = `
            <div class="search-container mb-4">
                <div class="input-group input-group-lg">
                    <span class="input-group-text"><i class="bi bi-search me-2"></i></span>
                    <input type="text" id="gallerySearch" class="form-control" 
                           placeholder="Search photos...">
                </div>
            </div>
        `;
        
        $('.container.my-5 h1').after(gallerySearchHTML);
        
        $('#gallerySearch').on('keyup', function() {
            const searchTerm = $(this).val().toLowerCase();
            
            $('.col-lg-4.col-md-6.col-sm-12').filter(function() {
                const cardText = $(this).text().toLowerCase();
                $(this).toggle(cardText.indexOf(searchTerm) > -1);
            });
        });
    }

    // Shows dropdown with suggestions as user types
    // ============================
    
    // Coffee menu suggestions
    const menuSuggestions = [
        'Latte', 'Cappuccino', 'Americano', 'Mocha', 'Espresso',
        'Coffee', 'Milk', 'Hot', 'Cold', 'Sweet'
    ];
    
    if ($('#menuSearch').length) {
        // Create suggestions dropdown
        const suggestionsHTML = `
            <ul id="searchSuggestions" class="list-group position-absolute w-100" 
                style="z-index: 1000; display: none;"></ul>
        `;
        $('#menuSearch').parent().css('position', 'relative').append(suggestionsHTML);
        
        // Show suggestions on input
        $('#menuSearch').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            const suggestions = $('#searchSuggestions');
            
            if (searchTerm.length < 2) {
                suggestions.hide();
                return;
            }
            
            // Filter suggestions
            const matches = menuSuggestions.filter(item => 
                item.toLowerCase().includes(searchTerm)
            );
            
            if (matches.length > 0) {
                suggestions.empty();
                matches.forEach(match => {
                    const li = $('<li>')
                        .addClass('list-group-item list-group-item-action')
                        .text(match)
                        .css('cursor', 'pointer')
                        .on('click', function() {
                            $('#menuSearch').val(match).trigger('keyup');
                            suggestions.hide();
                        });
                    suggestions.append(li);
                });
                suggestions.show();
            } else {
                suggestions.hide();
            }
        });
        
        // Hide suggestions when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.search-container').length) {
                $('#searchSuggestions').hide();
            }
        });
    }

    // Highlights matching text in search results
    // ============================
    
    // Add search highlighting functionality
    if ($('#menuSearch').length) {
        // Store original content
        $('.card-body').each(function() {
            if (!$(this).data('original-content')) {
                $(this).data('original-content', $(this).html());
            }
        });
        
        $('#menuSearch').on('keyup', function() {
            const searchTerm = $(this).val();
            
            $('.card-body').each(function() {
                const element = $(this);
                const originalContent = element.data('original-content');
                
                if (searchTerm.length >= 2) {
                    // Highlight only text inside specific elements
                    let highlightedContent = originalContent;
                    
                    // Create a temporary div to parse HTML
                    const tempDiv = $('<div>').html(originalContent);
                    
                    // Highlight only in card-title and card-text
                    tempDiv.find('.card-title, .card-text').each(function() {
                        const textElement = $(this);
                        const text = textElement.text();
                        const regex = new RegExp(`(${searchTerm})`, 'gi');
                        const highlightedText = text.replace(regex, '<mark class="highlight">$1</mark>');
                        textElement.html(highlightedText);
                    });
                    
                    element.html(tempDiv.html());
                } else {
                    // Restore original content
                    element.html(originalContent);
                }
            });
        });
    }
    
    // Add CSS for highlighting
    if (!$('#highlight-styles').length) {
        $('head').append(`
            <style id="highlight-styles">
                .highlight {
                    background-color: #ffc107;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-weight: bold;
                }
            </style>
        `);
    }
}


// PART 2: UX Engagement Elements with jQuery
// ============================

function initializeUXElements() {
    

    // Shows progress as user scrolls down the page
    // ============================
    
    // Create progress bar HTML
    const progressBarHTML = `
        <div id="scrollProgress" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 5px;
            background: linear-gradient(90deg, #b76e79, #ffc107, #28a745);
            z-index: 9999;
            transition: width 0.1s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
    `;
    $('body').prepend(progressBarHTML);
    
    // Update progress bar on scroll
    $(window).on('scroll', function() {
        const scrollTop = $(window).scrollTop();
        const docHeight = $(document).height() - $(window).height();
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        $('#scrollProgress').css('width', scrollPercent + '%');
    });
    

    // Counts up numbers smoothly for statistics
    // ============================
    
    // Add stats section to home page
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        const statsHTML = `
            <section class="stats-section py-5 bg-light">
                <div class="container">
                    <div class="row text-center">
                        <div class="col-md-4 mb-4">
                            <h2 class="counter text-primary" data-target="1000">0</h2>
                            <p class="text-muted">Happy Customers</p>
                        </div>
                        <div class="col-md-4 mb-4">
                            <h2 class="counter text-success" data-target="50">0</h2>
                            <p class="text-muted">Coffee Varieties</p>
                        </div>
                        <div class="col-md-4 mb-4">
                            <h2 class="counter text-warning" data-target="5">0</h2>
                            <p class="text-muted">Years of Experience</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
        
        $('main').append(statsHTML);
        
        // Animate counters when visible
        let counted = false;
        $(window).on('scroll', function() {
            const statsSection = $('.stats-section');
            if (statsSection.length && !counted) {
                const sectionTop = statsSection.offset().top;
                const windowBottom = $(window).scrollTop() + $(window).height();
                
                if (windowBottom > sectionTop) {
                    counted = true;
                    
                    $('.counter').each(function() {
                        const $this = $(this);
                        const target = parseInt($this.attr('data-target'));
                        
                        $({ counter: 0 }).animate({ counter: target }, {
                            duration: 2000,
                            easing: 'swing',
                            step: function() {
                                $this.text(Math.ceil(this.counter) + '+');
                            },
                            complete: function() {
                                $this.text(target + '+');
                            }
                        });
                    });
                }
            }
        });
    }

    // Shows spinner when form is submitted
    // ============================
    
    if ($('#contactForm').length) {
        $('#contactForm').on('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = $(this).find('button[type="submit"]');
            const originalText = submitBtn.html();
            
            // Disable button and show spinner
            submitBtn.prop('disabled', true)
                     .html('<span class="spinner-border spinner-border-sm me-2"></span>Please wait...');
            
            // Simulate server call
            setTimeout(function() {
                // Show success notification
                showNotification('<i class="bi bi-check-circle me-2"></i> Form submitted successfully!', 'success');
                
                // Reset button
                submitBtn.prop('disabled', false).html(originalText);
                
                // Reset form
                $('#contactForm')[0].reset();
            }, 2500);
        });
    }
}

// PART 3: Using jQuery to Improve Web App Functionality
// ============================

function initializeFunctionalityImprovements() {

    // Shows temporary notifications that fade out
    // ============================
    
    // Create notification container
    if (!$('#notificationContainer').length) {
        $('body').append(`
            <div id="notificationContainer" style="
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            "></div>
        `);
    }
    
    // Add notifications to various actions
    $('.btn-outline-primary').on('click', function(e) {
        if ($(this).text().includes('Order Now')) {
            e.preventDefault();
            const itemName = $(this).closest('.card-body').find('.card-title').text();
            showNotification(`<i class="bi bi-cup-hot me-2"></i> ${itemName} added to cart!`, 'success');
        }
    });
    
    // Subscribe button notification
    $('#subscribeBtn').on('click', function() {
        showNotification('<i class="bi bi-envelope-fill me-2"></i> Opening subscription form...', 'info');
    });
    

    // Adds copy functionality with visual feedback
    // ============================
    
    // Add copy buttons to contact information
    $('.text-white.text-decoration-none.fs-5').each(function() {
        const phoneNumber = $(this).text();
        const copyBtn = $(`
            <button class="btn btn-sm btn-outline-light ms-2 copy-phone-btn" 
                    data-phone="${phoneNumber}">
                <i class="bi bi-clipboard-check me-2"></i> Copy
            </button>
        `);
        
        $(this).after(copyBtn);
        
        copyBtn.on('click', function() {
            const phone = $(this).attr('data-phone');
            
            // Copy to clipboard
            navigator.clipboard.writeText(phone).then(() => {
                // Change button appearance
                $(this).html('<i class="bi bi-check-lg me-1"></i> Copied!')
                       .removeClass('btn-outline-light')
                       .addClass('btn-success');
                
                showNotification('<i class="bi bi-clipboard-check me-2"></i> Phone number copied to clipboard!', 'success');
                
                // Reset button after 2 seconds
                const btn = $(this);
                setTimeout(() => {
                    btn.html('<i class="bi bi-clipboard-check me-2"></i> Copy')
                       .removeClass('btn-success')
                       .addClass('btn-outline-light');
                }, 2000);
            });
        });
    });
    
    // Add copy buttons to address
    if ($('.card-text.text-muted').length) {
        $('.card-text.text-muted').filter(function() {
            return $(this).text().includes('Astana');
        }).each(function() {
            const address = $(this).text();
            const copyBtn = $(`
                <button class="btn btn-sm btn-outline-primary mt-2 copy-address-btn" 
                        data-address="${address}">
                    <i class="bi bi-clipboard-check me-2"></i> Copy Address
                </button>
            `);
            
            $(this).after(copyBtn);
            
            copyBtn.on('click', function() {
                const addr = $(this).attr('data-address');
                
                navigator.clipboard.writeText(addr).then(() => {
                    $(this).html('<i class="bi bi-check-lg me-1"></i> Copied!')
                           .removeClass('btn-outline-primary')
                           .addClass('btn-success');
                    
                    showNotification('<i class="bi bi-geo-alt-fill me-2"></i> Address copied to clipboard!', 'success');
                    
                    const btn = $(this);
                    setTimeout(() => {
                        btn.html('<i class="bi bi-clipboard-check me-2"></i> Copy Address')
                           .removeClass('btn-success')
                           .addClass('btn-outline-primary');
                    }, 2000);
                });
            });
        });
    }
    

    // Loads images only when they come into view
    // ============================
    
    // Convert existing images to lazy loading
    $('img').not('.carousel-img').each(function() {
        const $img = $(this);
        const src = $img.attr('src');
        
        if (src && !$img.hasClass('lazy-loaded')) {
            // Store original src and replace with placeholder
            $img.attr('data-src', src)
                .attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E')
                .addClass('lazy-image');
        }
    });
    
    // Lazy load images on scroll
    function lazyLoadImages() {
        $('.lazy-image').each(function() {
            const $img = $(this);
            const imgTop = $img.offset().top;
            const imgBottom = imgTop + $img.height();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            
            // Check if image is in viewport
            if (imgBottom > viewportTop && imgTop < viewportBottom + 200) {
                const dataSrc = $img.attr('data-src');
                if (dataSrc) {
                    $img.attr('src', dataSrc)
                        .removeClass('lazy-image')
                        .addClass('lazy-loaded')
                        .fadeIn(500);
                }
            }
        });
    }
    
    // Initial load and scroll event
    lazyLoadImages();
    $(window).on('scroll', lazyLoadImages);
}

// HELPER FUNCTIONS
// ============================

// Notification helper function
function showNotification(message, type = 'info') {
    const types = {
        'success': 'alert-success',
        'info': 'alert-info',
        'warning': 'alert-warning',
        'error': 'alert-danger'
    };
    
    const notification = $(`
        <div class="alert ${types[type]} alert-dismissible fade show shadow-lg" 
             role="alert" style="margin-bottom: 10px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('#notificationContainer').append(notification);
    
    // Auto-dismiss after 4 seconds
    setTimeout(function() {
        notification.fadeOut(500, function() {
            $(this).remove();
        });
    }, 4000);
}


// ADDITIONAL ENHANCEMENTS
// ============================

$(document).ready(function() {
    
    // Smooth scroll for all anchor links
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 1000);
        }
    });
    
    // Add hover effects using jQuery
    $('.card').hover(
        function() {
            $(this).addClass('shadow-lg').css('transform', 'translateY(-10px)');
        },
        function() {
            $(this).removeClass('shadow-lg').css('transform', 'translateY(0)');
        }
    );
    
    // Animate elements on page load
    $('.container').hide().fadeIn(1000);
    
    console.log('All jQuery features initialized successfully!');
});