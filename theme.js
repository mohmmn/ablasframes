// Theme switcher: auto based on time + manual toggle
(function () {
    function setThemeByTime() {
        const now = new Date();
        const hour = now.getHours();
        const isNight = hour < 6 || hour >= 18; // 18h-6h night
        document.documentElement.classList.toggle('dark', isNight);
    }

    // Run on load
    setThemeByTime();

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🌙/☀️';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '1rem';
    toggleBtn.style.right = '1rem';
    toggleBtn.style.zIndex = '1000';
    toggleBtn.style.border = 'none';
    toggleBtn.style.background = 'transparent';
    toggleBtn.style.fontSize = '1.5rem';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.color = 'var(--text-dark)';
    toggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        // Update icon based on current theme
        const isDark = document.documentElement.classList.contains('dark');
        toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
    });

    // Initialize icon
    const isDarkInitially = document.documentElement.classList.contains('dark');
    toggleBtn.innerHTML = isDarkInitially ? '☀️' : '🌙';

    document.body.appendChild(toggleBtn);

    // Optional: progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '2px';
    progressBar.style.background = 'var(--accent)';
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width .2s ease';
    progressBar.style.zIndex = '999';
    document.body.appendChild(progressBar);

    function updateProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }

    window.addEventListener('scroll', updateProgress);
    // Initial call
    updateProgress();

    // Re-use existing switchPage function from script.js but we can keep it; we just need to ensure theme persists.
    // No modifications needed.
})();