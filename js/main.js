/**
 * Main JavaScript file for the academic portfolio website.
 *
 * This script handles:
 * 1. Mobile menu toggling.
 * 2. Highlighting the active navigation link.
 * 3. Light/Dark theme toggling and persistence.
 * 4. Advanced site search with Fuse.js (fuzzy search), including:
 * - Asynchronously fetching page content for the search index.
 * - A focus trap for accessibility when the modal is open.
 * 5. Initialization of the cookie consent banner.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const closeIcon = document.getElementById('close-icon');

    if (mobileMenuButton && mobileMenu && hamburgerIcon && closeIcon) {
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            hamburgerIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        });
    }

    // --- 2. Active Nav Link Styling ---
    const pageName = window.location.pathname.split('/').pop().split('.').shift();
    let activePage;
    if (pageName === 'index' || pageName === '') {
        activePage = 'about';
    } else if (pageName === 'monday-lab') {
        activePage = 'teaching'; // Highlight 'Teaching' for the 'Monday Lab' sub-page
    } else {
        activePage = pageName;
    }
    const navLinks = document.querySelectorAll(`.nav-link-${activePage}`);
    navLinks.forEach(link => {
        link.classList.add('nav-link-active');
    });

    // --- 3. Theme Toggle ---
    const themeToggles = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');
    const darkIcons = document.querySelectorAll('#theme-toggle-dark-icon, #theme-toggle-dark-icon-mobile');
    const lightIcons = document.querySelectorAll('#theme-toggle-light-icon, #theme-toggle-light-icon-mobile');

    function updateAllThemeIcons() {
        const isDark = document.documentElement.classList.contains('dark');
        darkIcons.forEach(icon => icon.classList.toggle('hidden', isDark));
        lightIcons.forEach(icon => icon.classList.toggle('hidden', !isDark));
    }

    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
            updateAllThemeIcons();
        });
    });
    updateAllThemeIcons(); // Set initial icon state on page load

    // --- 4. Site Search (Upgraded with Fuse.js and Accessibility) ---
    const searchModal = document.getElementById('search-modal');
    const searchModalPanel = document.getElementById('search-modal-panel');
    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('search-results-list');
    const placeholder = document.getElementById('search-placeholder');
    const searchButtons = document.querySelectorAll('#search-button, #search-button-mobile');
    
    if (searchModal) {
        let fuse;
        let isDataFetched = false;
        
        const searchIndex = [
            { title: 'About', url: 'index.html' },
            { title: 'Research', url: 'research.html' },
            { title: 'Teaching', url: 'teaching.html' },
            { title: 'Monday Lab', url: 'monday-lab.html' },
            { title: 'Privacy Policy', url: 'privacy.html' }
        ];

        async function fetchPageContent() {
            if (isDataFetched) return;
            try {
                const pageContents = await Promise.all(
                    searchIndex.map(async (page) => {
                        const response = await fetch(page.url);
                        if (!response.ok) throw new Error(`Failed to fetch ${page.url}`);
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const mainContent = doc.querySelector('main')?.textContent || '';
                        return {
                            title: page.title,
                            url: page.url,
                            content: mainContent.toLowerCase().replace(/\s+/g, ' ').trim()
                        };
                    })
                );
                
                fuse = new Fuse(pageContents, {
                    keys: ['title', 'content'],
                    includeScore: true,
                    threshold: 0.4,
                });
                isDataFetched = true;
            } catch (error) {
                console.error("Could not fetch page content for search:", error);
                if(placeholder) placeholder.textContent = "Error: Could not load search index.";
            }
        }

        let focusableElements = [];
        let firstFocusableElement;
        let lastFocusableElement;

        function openSearch() {
            searchModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // A11y: Set up focus trap
            focusableElements = Array.from(searchModalPanel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ));
            firstFocusableElement = focusableElements[0];
            lastFocusableElement = focusableElements[focusableElements.length - 1];
            
            searchInput.focus();
            fetchPageContent();
        }

        function closeSearch() {
            searchModal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        function performSearch() {
            if (!fuse) return;
            const query = searchInput.value.trim();
            resultsList.innerHTML = '';

            if (query.length < 2) {
                placeholder.textContent = 'Please enter at least 2 characters.';
                placeholder.classList.remove('hidden');
                return;
            }

            const matches = fuse.search(query);

            if (matches.length > 0) {
                placeholder.classList.add('hidden');
                matches.forEach(({ item }) => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <a href="${item.url}" class="block p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <div class="font-semibold text-slate-800 dark:text-slate-200">${item.title}</div>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Match found on this page.</p>
                        </a>`;
                    resultsList.appendChild(li);
                });
            } else {
                placeholder.textContent = `No results found for "${query}"`;
                placeholder.classList.remove('hidden');
            }
        }

        searchButtons.forEach(btn => btn.addEventListener('click', openSearch));
        searchInput.addEventListener('input', performSearch);

        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearch();
        });

        document.addEventListener('keydown', (e) => {
            if (searchModal.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                closeSearch();
            }

            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // --- 5. Cookie Consent ---
    // Check if the CookieConsent library is available
    if (typeof CookieConsent !== 'undefined') {
        CookieConsent.run({
            guiOptions: {
                consentModal: { layout: "box", position: "bottom left" },
                preferencesModal: { layout: "box", position: "right" }
            },
            categories: {
                necessary: { readOnly: true },
                analytics: {}
            },
            language: {
                default: "en",
                translations: {
                    en: {
                        consentModal: {
                            title: "Hello there, traveler!",
                            description: "This website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent.",
                            acceptAllBtn: "Accept all",
                            acceptNecessaryBtn: "Reject all",
                            showPreferencesBtn: "Manage preferences",
                            footer: "<a href=\"privacy.html\">Privacy Policy</a>"
                        },
                        preferencesModal: {
                            title: "Cookie preferences",
                            acceptAllBtn: "Accept all",
                            acceptNecessaryBtn: "Reject all",
                            savePreferencesBtn: "Save preferences",
                            closeIconLabel: "Close modal",
                            sections: [
                                {
                                    title: "Cookie Usage",
                                    description: "I use cookies to ensure the basic functionalities of the website and to enhance your online experience. For more details, please read the full <a href=\"privacy.html\">privacy policy</a>."
                                },
                                {
                                    title: "Strictly Necessary Cookies",
                                    description: "These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly.",
                                    linkedCategory: "necessary"
                                },
                                {
                                    title: "Performance and Analytics Cookies",
                                    description: "These cookies are used to collect information about how you use the site, such as for the Altmetric badges on the research page.",
                                    linkedCategory: "analytics"
                                },
                                {
                                    title: "More information",
                                    description: "For any queries, please <a href=\"mailto:giovanbattista.califano@unina.it\">contact me</a>."
                                }
                            ]
                        }
                    }
                }
            }
        });
    }
});
