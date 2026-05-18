// Initialize Lucide Icons
lucide.createIcons();

// Initialize Smooth Scroll (Lenis)
const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero Animations
const heroTL = gsap.timeline();

heroTL.from(".reveal-text", {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
    stagger: 0.2
})
.from(".reveal-text-sub", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power4.out"
}, "-=0.8")
.from(".reveal-btn", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "power4.out"
}, "-=0.6")
.from("#hero-video", {
    scale: 1.2,
    opacity: 0,
    duration: 2,
    ease: "power2.out"
}, 0);

// Navbar scroll effect
ScrollTrigger.create({
    start: "top top",
    onUpdate: (self) => {
        if (self.scroll() > 50) {
            document.getElementById('navbar').classList.add('scrolled');
        } else {
            document.getElementById('navbar').classList.remove('scrolled');
        }
    }
});

// Modal Logic
const modals = document.querySelectorAll('.modal');
const closeBtns = document.querySelectorAll('.close-modal');

closeBtns.forEach(btn => {
    btn.onclick = () => {
        modals.forEach(m => m.classList.remove('active'));
    };
});

window.onclick = (event) => {
    modals.forEach(m => {
        if (event.target == m) {
            m.classList.remove('active');
        }
    });
};

// Admin Panel Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.admin-tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Admin Panel Submission
const adminBtn = document.getElementById('admin-btn');
const adminPanel = document.getElementById('admin-panel');
const machineForm = document.getElementById('add-machine-form');
const postForm = document.getElementById('add-post-form');
const postImageInput = postForm ? postForm.querySelector('input[name="images"]') : null;
const postImagePreview = document.getElementById('post-image-preview');

const MAX_POST_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_POST_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validatePostImages(files) {
    const images = Array.from(files || []);
    for (const file of images) {
        if (!ALLOWED_POST_IMAGE_TYPES.includes(file.type)) {
            throw new Error('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
        }
        if (file.size > MAX_POST_IMAGE_SIZE) {
            throw new Error(`${file.name} 파일이 10MB를 초과합니다.`);
        }
    }
    return images;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function safeStorageFileName(file, index) {
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${index}-${random}.${extension}`;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function uploadPostImages(files) {
    const images = validatePostImages(files);
    if (images.length === 0) return [];

    if (window.storage) {
        const uploaded = [];
        for (const [index, file] of images.entries()) {
            const storagePath = `post-images/${safeStorageFileName(file, index)}`;
            const ref = window.storage.ref().child(storagePath);
            const snapshot = await ref.put(file, {
                contentType: file.type,
                customMetadata: {
                    originalName: file.name
                }
            });
            uploaded.push({
                url: await snapshot.ref.getDownloadURL(),
                storagePath,
                name: file.name,
                size: file.size,
                type: file.type
            });
        }
        return uploaded;
    }

    if (window.db) {
        throw new Error('Firebase Storage가 초기화되지 않았습니다. Storage SDK와 보안 규칙을 확인해주세요.');
    }

    const localImages = [];
    for (const file of images) {
        localImages.push({
            url: await readFileAsDataUrl(file),
            name: file.name,
            size: file.size,
            type: file.type,
            localOnly: true
        });
    }
    return localImages;
}

if (postImageInput && postImagePreview) {
    postImageInput.addEventListener('change', () => {
        try {
            const images = validatePostImages(postImageInput.files);
            postImagePreview.innerHTML = images.map(file => `
                <div class="upload-preview-item">
                    <img src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}">
                    <span>${escapeHtml(file.name)}</span>
                </div>
            `).join('');
        } catch (error) {
            postImageInput.value = '';
            postImagePreview.innerHTML = '';
            alert(error.message);
        }
    });
}

if (adminBtn) {
    adminBtn.onclick = () => {
        if (localStorage.getItem('isAdmin') === 'true') {
            if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('isAdmin');
                alert('로그아웃 되었습니다.');
                location.reload();
            } else {
                adminPanel.classList.add('active');
            }
        } else {
            const password = prompt('관리자 암호를 입력해주세요:');
            if (password === 'sj1234') {
                localStorage.setItem('isAdmin', 'true');
                alert('관리자로 로그인되었습니다.');
                adminPanel.classList.add('active');
                location.reload();
            } else {
                alert('암호가 올바르지 않습니다.');
            }
        }
    };
}

// Machine Add
if (machineForm) {
    machineForm.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(machineForm);
        const data = {
            name: formData.get('name'),
            maker: formData.get('maker'),
            model: formData.get('model'),
            year: formData.get('year'),
            category: formData.get('category'),
            specs: formData.get('specs'),
            name_en: formData.get('name_en') || formData.get('name'),
            maker_en: formData.get('maker_en') || formData.get('maker'),
            model_en: formData.get('model_en') || formData.get('model'),
            specs_en: formData.get('specs_en') || formData.get('specs'),
            name_cn: formData.get('name_cn') || formData.get('name'),
            maker_cn: formData.get('maker_cn') || formData.get('maker'),
            model_cn: formData.get('model_cn') || formData.get('model'),
            specs_cn: formData.get('specs_cn') || formData.get('specs'),
            image: formData.get('image') || "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800",
            address: formData.get('address'),
            status: 'onsale'
        };

        if (window.inventoryManager) {
            window.inventoryManager.addMachine(data);
            adminPanel.classList.remove('active');
            machineForm.reset();
            showPage('#hero');
        }
    };

    // Auto Translate Free Logic
    const autoTranslateBtn = document.getElementById('auto-translate-btn');
    if (autoTranslateBtn) {
        async function translateText(text, targetLang) {
            if (!text) return '';
            try {
                const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
                const data = await res.json();
                return data[0].map(x => x[0]).join('');
            } catch (e) {
                console.error('Translation failed', e);
                return text;
            }
        }

        autoTranslateBtn.onclick = async () => {
            const nameKo = machineForm.querySelector('input[name="name"]').value;
            const makerKo = machineForm.querySelector('input[name="maker"]').value;
            const modelKo = machineForm.querySelector('input[name="model"]').value;
            const specsKo = machineForm.querySelector('textarea[name="specs"]').value;

            autoTranslateBtn.innerText = "⏳ 번역 중...";
            autoTranslateBtn.disabled = true;

            try {
                // English
                if (nameKo) machineForm.querySelector('input[name="name_en"]').value = await translateText(nameKo, 'en');
                if (makerKo) machineForm.querySelector('input[name="maker_en"]').value = await translateText(makerKo, 'en');
                if (modelKo) machineForm.querySelector('input[name="model_en"]').value = await translateText(modelKo, 'en');
                if (specsKo) machineForm.querySelector('textarea[name="specs_en"]').value = await translateText(specsKo, 'en');

                // Chinese (Simplified)
                if (nameKo) machineForm.querySelector('input[name="name_cn"]').value = await translateText(nameKo, 'zh-CN');
                if (makerKo) machineForm.querySelector('input[name="maker_cn"]').value = await translateText(makerKo, 'zh-CN');
                if (modelKo) machineForm.querySelector('input[name="model_cn"]').value = await translateText(modelKo, 'zh-CN');
                if (specsKo) machineForm.querySelector('textarea[name="specs_cn"]').value = await translateText(specsKo, 'zh-CN');
                
                alert("자동 번역이 완료되었습니다. 내용을 확인하고 수정할 수 있습니다.");
            } catch (e) {
                alert("번역 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                autoTranslateBtn.innerText = "🌐 자동 번역하기 (무료 API)";
                autoTranslateBtn.disabled = false;
            }
        };
    }
}

// Post Add
if (postForm) {
    postForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = postForm.querySelector('button[type="submit"]');
        const formData = new FormData(postForm);
        const originalText = submitBtn ? submitBtn.innerText : '';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = '업로드 중...';
            }

            const images = await uploadPostImages(postImageInput ? postImageInput.files : []);
            const data = {
                title: formData.get('title'),
                content: formData.get('content'),
                author: formData.get('author'),
                date: new Date().toISOString().split('T')[0],
                views: 0,
                images,
                coverImage: images[0] ? images[0].url : ''
            };

            if (window.boardManager) {
                await window.boardManager.addPost(data);
                adminPanel.classList.remove('active');
                postForm.reset();
                if (postImagePreview) postImagePreview.innerHTML = '';
                showPage('#board');
            }
        } catch (error) {
            console.error('Post upload failed:', error);
            alert(error.message || '게시글 등록 중 오류가 발생했습니다.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        }
    };
}

// Contact Form
const contactForm = document.getElementById('main-contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = contactForm.querySelector('input[type="text"]').value;
        const phone = contactForm.querySelector('input[type="tel"]').value;
        const model = contactForm.querySelectorAll('input[type="text"]')[1].value;
        const message = contactForm.querySelector('textarea').value;

        const subject = `[서종기계 매물문의] ${name}님`;
        const body = `성함: ${name}\n연락처: ${phone}\n관심기종: ${model}\n내용: ${message}`;
        
        window.location.href = `mailto:dldbcks0619@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        alert('이메일 클라이언트가 실행됩니다. 메일을 보내주시면 확인 후 연락드리겠습니다.');
        contactForm.reset();
    });
}

// SPA Router Logic
const navLinks = document.querySelectorAll('.nav-links a');
const sections = {
    '#hero': ['#hero', '#inventory', '#cta'],
    '#inventory': ['#hero', '#inventory', '#cta'],
    '#board': ['#board'],
    '#about': ['#about'],
    '#contact': ['#contact']
};

function showPage(targetId) {
    if (!targetId || !sections[targetId]) targetId = '#hero';

    // Determine which sections to show
    const sectionsToShow = sections[targetId];
    
    // Hide all sections first
    document.querySelectorAll('section').forEach(s => {
        s.style.display = 'none';
        s.style.opacity = '0';
    });

    // Show selected sections with a small fade in
    sectionsToShow.forEach(id => {
        const el = document.querySelector(id);
        if (el) {
            el.style.display = 'block';
            gsap.to(el, { opacity: 1, duration: 0.5 });
            
            // Fix for Kakao Map relayout if about section is shown
            if (id === '#about' && window.kakaoMap) {
                setTimeout(() => {
                    window.kakaoMap.relayout();
                    window.kakaoMap.setCenter(window.kakaoMapCenter);
                }, 500);
            }
        }
    });

    // Scroll to target
    if (targetId === '#hero') {
        lenis.scrollTo(0, { immediate: true });
    } else {
        // Give the DOM a tiny bit of time to render the block display before calculating scroll position
        setTimeout(() => {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                lenis.scrollTo(targetEl, { offset: -80, duration: 1.2 });
            }
        }, 50);
    }

    // Update Nav Active State
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });

    // Handle Kakao Map Relayout when About page is shown
    if (targetId === '#about' && typeof initMap === 'function') {
        setTimeout(initMap, 100); // Give a small delay for display:block to settle
    }

    // Refresh ScrollTrigger and Lucide
    ScrollTrigger.refresh();
}

// Make globally accessible for inline onclick
window.showPage = showPage;

// Initial View
showPage(window.location.hash || '#hero');

// Global Router Listener
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        showPage(targetId);
        window.location.hash = targetId;
    }
});

// Handle External calls or direct button clicks that set hash
window.addEventListener('hashchange', () => {
    showPage(window.location.hash);
});

// Global Language State
window.currentLang = localStorage.getItem('site_lang') || 'ko';

const langBtns = document.querySelectorAll('.lang-btn');

// Initialize Active Button and Translations
langBtns.forEach(b => {
    b.classList.remove('active');
    if(b.getAttribute('data-lang') === window.currentLang) {
        b.classList.add('active');
    }
});
if (window.applyI18n) window.applyI18n(window.currentLang);

langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedLang = btn.getAttribute('data-lang');
        window.currentLang = selectedLang;
        localStorage.setItem('site_lang', selectedLang);
        
        // Apply translations to static text
        if (window.applyI18n) window.applyI18n(selectedLang);
        
        // Re-render inventory to show translated data
        if (window.inventoryManager && window.inventoryManager.render) {
            window.inventoryManager.render();
        }
    });
});
