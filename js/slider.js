document.addEventListener("DOMContentLoaded", function () {
    // Initialize Hero Slider (Swiper)
    const heroSlider = new Swiper('.hero-slider', {
        loop: false, // set to true if multiple slides are added
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        speed: 2000,
        pagination: {
            el: '.swiper-pagination2',
            clickable: true,
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        }
    });
});
