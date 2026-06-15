
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
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

        // Add hover effect to product items
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(5px)';
            });
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
            });
        });

        // Button click handlers
        document.querySelector('.login-btn').addEventListener('click', function() {
            alert('Redirecting to login page...');
        });

        document.querySelector('.signup-btn').addEventListener('click', function() {
            alert('Redirecting to sign up page...');
        });

        document.querySelector('.cta-primary-btn').addEventListener('click', function() {
            alert('Starting your free trial...');
        });

        document.querySelector('.cta-secondary-btn').addEventListener('click', function() {
            alert('Redirecting to login page...');
        });

        // Add dynamic expiry status updates (simulated)
        function updateExpiryStatus() {
            const expiryItems = document.querySelectorAll('.product-expiry');
            expiryItems.forEach(item => {
                console.log('Expiry status:', item.textContent);
            });
        }

        // Call on page load
        window.addEventListener('load', function() {
            updateExpiryStatus();
        });

        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                console.log('Escape key pressed');
            }
        });

        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .step-card').forEach(card => {
            observer.observe(card);
        });

        // Footer CTA button handlers
        document.querySelector('.footer-cta-primary-btn').addEventListener('click', function() {
            alert('Creating your account...');
        });

        document.querySelector('.footer-cta-secondary-btn').addEventListener('click', function() {
            alert('Redirecting to login page...');
        });
    