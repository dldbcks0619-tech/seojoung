// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Initialize Smooth Scroll (Lenis)
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5
    });

    function raf(time) {
        if (lenis) lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// GSAP Animations
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animations
    const heroTL = gsap.timeline();

    const revealText = document.querySelectorAll(".reveal-text");
    const revealTextSub = document.querySelectorAll(".reveal-text-sub");
    const revealBtn = document.querySelectorAll(".reveal-btn");
    const heroVideo = document.querySelectorAll(".video-background video");

    if (revealText.length > 0) {
        heroTL.from(revealText, {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.2
        });
    }

    if (revealTextSub.length > 0) {
        heroTL.from(revealTextSub, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power4.out"
        }, "-=0.8");
    }

    if (revealBtn.length > 0) {
        heroTL.from(revealBtn, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power4.out"
        }, "-=0.6");
    }

    if (heroVideo.length > 0) {
        heroTL.from(heroVideo, {
            scale: 1.2,
            opacity: 0,
            duration: 2,
            ease: "power2.out"
        }, 0);
    }

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
}

// Modal Logic
const modals = document.querySelectorAll('.modal');
const closeBtns = document.querySelectorAll('.close-modal');

closeBtns.forEach(btn => {
    btn.onclick = () => {
        modals.forEach(m => m.classList.remove('active'));
        if (window.editingMachineId) {
            window.editingMachineId = null;
            if (machineForm) {
                machineForm.reset();
                const submitBtn = machineForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.innerText = '매물 등록하기';
                const preview = document.getElementById('machine-image-preview');
                if (preview) preview.innerHTML = '';
            }
        }
    };
});

window.onclick = (event) => {
    modals.forEach(m => {
        if (event.target == m) {
            m.classList.remove('active');
            if (m.id === 'admin-panel' && window.editingMachineId) {
                window.editingMachineId = null;
                if (machineForm) {
                    machineForm.reset();
                    const submitBtn = machineForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.innerText = '매물 등록하기';
                    const preview = document.getElementById('machine-image-preview');
                    if (preview) preview.innerHTML = '';
                }
            }
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

async function compressImageToDataURL(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // 100% 무료 유지를 위해 데이터베이스에 직접 저장 가능한 DataURL(WebP)로 변환
                const dataUrl = canvas.toDataURL('image/webp', quality);
                resolve({
                    url: dataUrl,
                    name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
                    type: 'image/webp',
                    size: Math.round(dataUrl.length * 0.75) // Approximate bytes
                });
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadPostImages(files) {
    const originalImages = validatePostImages(files);
    if (originalImages.length === 0) return [];

    const uploaded = [];
    for (const file of originalImages) {
        try {
            // Firestore 용량 제한(1MB)을 넘지 않도록 가로 800px로 압축
            const result = await compressImageToDataURL(file, 800, 0.6);
            uploaded.push(result);
        } catch (e) {
            console.error("Image compression failed", e);
        }
    }
    return uploaded;
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

const machineImageInput = machineForm ? machineForm.querySelector('input[name="machine_images"]') : null;
const machineImagePreview = document.getElementById('machine-image-preview');

if (machineImageInput && machineImagePreview) {
    machineImageInput.addEventListener('change', () => {
        try {
            const images = validatePostImages(machineImageInput.files);
            machineImagePreview.innerHTML = images.map(file => `
                <div class="upload-preview-item">
                    <img src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}">
                    <span>${escapeHtml(file.name)}</span>
                </div>
            `).join('');
        } catch (error) {
            machineImageInput.value = '';
            machineImagePreview.innerHTML = '';
            alert(error.message);
        }
    });
}

if (adminBtn) {
    if (localStorage.getItem('isAdmin') === 'true') {
        adminBtn.style.display = 'inline-block';
    }
    adminBtn.onclick = () => {
        if (localStorage.getItem('isAdmin') === 'true') {
            if (confirm('로그아웃 하시겠습니까? (취소 시 관리자 창 열림)')) {
                localStorage.removeItem('isAdmin');
                alert('로그아웃 되었습니다.');
                location.reload();
            } else {
                adminPanel.classList.add('active');
            }
        }
    };
}

// Hidden Admin Shortcut (Ctrl + 5 Logo Clicks)
let logoClickCount = 0;
let logoClickTimer;
const logoEl = document.querySelector('.logo');
if (logoEl) {
    logoEl.addEventListener('click', (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        logoClickCount++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
        
        if (logoClickCount >= 5) {
            logoClickCount = 0;
            const password = prompt('관리자 암호를 입력해주세요:');
            if (password === '1234') {
                window.isAdmin = true;
                localStorage.setItem('isAdmin', 'true');
                alert('관리자로 로그인되었습니다.');
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'inline-block';
                });
            } else {
                alert('암호가 올바르지 않습니다.');
            }
        }
    });
}

// Machine Add
if (machineForm) {
    machineForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = machineForm.querySelector('button[type="submit"]');
        const isEditing = !!window.editingMachineId;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = isEditing ? '수정 중...' : '업로드 중...';
        }
        
        try {
            const formData = new FormData(machineForm);
            let imageUrl = "";
            let imageUrls = [];
            
            // If editing, pull existing images first as a fallback
            if (isEditing && window.inventoryManager) {
                const existing = window.inventoryManager.machines.find(m => String(m.id) === String(window.editingMachineId));
                if (existing) {
                    imageUrl = existing.image || "";
                    imageUrls = existing.imageUrls || [];
                }
            }

            const machineImageInput = machineForm.querySelector('input[name="machine_images"]');
            if (machineImageInput && machineImageInput.files.length > 0) {
                const uploaded = await uploadPostImages(machineImageInput.files);
                imageUrls = uploaded.map(u => u.url);
                if (imageUrls.length > 0) imageUrl = imageUrls[0];
            }

            const data = {
                name: formData.get('name'),
                maker: formData.get('maker'),
                model: formData.get('model'),
                year: formData.get('year'),
                category: formData.get('category'),
                specs: formData.get('specs'),
                description: formData.get('description') || '',
                name_en: formData.get('name_en') || formData.get('name'),
                maker_en: formData.get('maker_en') || formData.get('maker'),
                model_en: formData.get('model_en') || formData.get('model'),
                specs_en: formData.get('specs_en') || formData.get('specs'),
                description_en: formData.get('description_en') || formData.get('description') || '',
                name_cn: formData.get('name_cn') || formData.get('name'),
                maker_cn: formData.get('maker_cn') || formData.get('maker'),
                model_cn: formData.get('model_cn') || formData.get('model'),
                specs_cn: formData.get('specs_cn') || formData.get('specs'),
                description_cn: formData.get('description_cn') || formData.get('description') || '',
                image: imageUrl,
                imageUrls: imageUrls,
                address: formData.get('address'),
                status: formData.get('status') || 'onsale'
            };

            if (window.inventoryManager) {
                if (isEditing) {
                    await window.inventoryManager.updateMachine(window.editingMachineId, data);
                    window.editingMachineId = null;
                    if (submitBtn) submitBtn.innerText = '매물 등록하기';
                } else {
                    await window.inventoryManager.addMachine(data);
                }
                adminPanel.classList.remove('active');
                machineForm.reset();
                const preview = document.getElementById('machine-image-preview');
                if (preview) preview.innerHTML = '';
                showPage('#hero');
            }
        } catch (error) {
            console.error(error);
            alert(isEditing ? '기계 수정 중 오류가 발생했습니다.' : '기계 등록 중 오류가 발생했습니다.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                if (!window.editingMachineId) {
                    submitBtn.innerText = '매물 등록하기';
                } else {
                    submitBtn.innerText = '매물 수정 완료';
                }
            }
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
            const descKo = machineForm.querySelector('textarea[name="description"]').value;

            autoTranslateBtn.innerText = "⏳ 번역 중...";
            autoTranslateBtn.disabled = true;

            try {
                // English
                if (nameKo) machineForm.querySelector('input[name="name_en"]').value = await translateText(nameKo, 'en');
                if (makerKo) machineForm.querySelector('input[name="maker_en"]').value = await translateText(makerKo, 'en');
                if (modelKo) machineForm.querySelector('input[name="model_en"]').value = await translateText(modelKo, 'en');
                if (specsKo) machineForm.querySelector('textarea[name="specs_en"]').value = await translateText(specsKo, 'en');
                if (descKo) machineForm.querySelector('textarea[name="description_en"]').value = await translateText(descKo, 'en');

                // Chinese (Simplified)
                if (nameKo) machineForm.querySelector('input[name="name_cn"]').value = await translateText(nameKo, 'zh-CN');
                if (makerKo) machineForm.querySelector('input[name="maker_cn"]').value = await translateText(makerKo, 'zh-CN');
                if (modelKo) machineForm.querySelector('input[name="model_cn"]').value = await translateText(modelKo, 'zh-CN');
                if (specsKo) machineForm.querySelector('textarea[name="specs_cn"]').value = await translateText(specsKo, 'zh-CN');
                if (descKo) machineForm.querySelector('textarea[name="description_cn"]').value = await translateText(descKo, 'zh-CN');
                
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
                title_en: formData.get('title_en') || formData.get('title'),
                content_en: formData.get('content_en') || formData.get('content'),
                title_cn: formData.get('title_cn') || formData.get('title'),
                content_cn: formData.get('content_cn') || formData.get('content'),
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

    // Auto Translate for Post
    const postAutoTranslateBtn = document.getElementById('post-auto-translate-btn');
    if (postAutoTranslateBtn) {
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

        postAutoTranslateBtn.onclick = async () => {
            const titleKo = postForm.querySelector('input[name="title"]').value;
            const contentKo = postForm.querySelector('textarea[name="content"]').value;

            postAutoTranslateBtn.innerText = "⏳ 번역 중...";
            postAutoTranslateBtn.disabled = true;

            try {
                // English
                if (titleKo) postForm.querySelector('input[name="title_en"]').value = await translateText(titleKo, 'en');
                if (contentKo) postForm.querySelector('textarea[name="content_en"]').value = await translateText(contentKo, 'en');

                // Chinese (Simplified)
                if (titleKo) postForm.querySelector('input[name="title_cn"]').value = await translateText(titleKo, 'zh-CN');
                if (contentKo) postForm.querySelector('textarea[name="content_cn"]').value = await translateText(contentKo, 'zh-CN');
                
                alert("자동 번역이 완료되었습니다. 내용을 확인하고 수정할 수 있습니다.");
            } catch (e) {
                alert("번역 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                postAutoTranslateBtn.innerText = "🌐 자동 번역하기 (무료 API)";
                postAutoTranslateBtn.disabled = false;
            }
        };
    }
}

// Contact Form
const contactForm = document.getElementById('main-contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Check privacy agreement checkbox
        const privacyCheckbox = document.getElementById('privacy-agree-checkbox');
        if (!privacyCheckbox || !privacyCheckbox.checked) {
            const lang = window.currentLang || 'ko';
            const alertMsg = (window.i18nData && window.i18nData.alert_privacy && window.i18nData.alert_privacy[lang])
                || "개인정보 수집 및 이용에 동의하셔야 신청이 가능합니다.";
            alert(alertMsg);
            return;
        }

        const name = contactForm.querySelector('input[type="text"]').value;
        const phone = contactForm.querySelector('input[type="tel"]').value;
        const model = contactForm.querySelectorAll('input[type="text"]')[1].value;
        const message = contactForm.querySelector('textarea').value;

        // 2. Visual Feedback (Loading State)
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '상담 신청하기';
        const lang = window.currentLang || 'ko';
        const sendingText = (window.i18nData && window.i18nData.submit_btn_sending && window.i18nData.submit_btn_sending[lang])
            || "전송 중...";

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = sendingText;
        }

        // 3. Prepare Payload
        const emailSubject = `[서종기계 웹사이트 문의] ${name}님의 파트너십 문의입니다.`;

        try {
            // 4. Send Email via FormSubmit.co's robust global AJAX API
            const emailPromise = fetch("https://formsubmit.co/ajax/dldbcks0619@naver.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    "이름 (Name)": name,
                    "연락처 (Phone)": phone,
                    "관심 기종 / 모델명 (Model)": model,
                    "문의내용 (Message)": message,
                    "_subject": emailSubject
                })
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error("FormSubmit response not ok");
                }
                return res.json();
            });

            // 5. Save in Firebase Firestore inquiries collection as Backup (Fail-silent)
            let dbPromise = Promise.resolve();
            if (window.db) {
                dbPromise = window.db.collection('inquiries').add({
                    name: name,
                    phone: phone,
                    model: model,
                    message: message,
                    status: 'unread',
                    createdAt: new Date().toISOString()
                }).catch(err => {
                    console.warn("Firestore backup inquiry save failed (possibly due to rules or config):", err);
                });
            }

            // Wait for both to complete (fail-silent for DB)
            // Note: Since we are using no-cors mode, the emailResponse has an opaque status of 0, so we do not check emailResponse.ok.
            await Promise.all([emailPromise, dbPromise]);

            // 6. Success
            const successMsg = (window.i18nData && window.i18nData.alert_success && window.i18nData.alert_success[lang])
                || "상담 신청이 정상적으로 접수되었습니다. 확인 후 신속하게 연락드리겠습니다.";
            alert(successMsg);

            // Reset form and checkbox
            contactForm.reset();
        } catch (error) {
            console.error("Inquiry submission failed:", error);
            alert(lang === 'ko' ? "문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." : "An error occurred while sending your inquiry. Please try again later.");
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
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
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
    } else {
        // Give the DOM a tiny bit of time to render the block display before calculating scroll position
        setTimeout(() => {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                if (lenis) lenis.scrollTo(targetEl, { offset: -80, duration: 1.2 });
                else targetEl.scrollIntoView({ behavior: 'smooth' });
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

// Admin UI Utils
window.openAdminTab = function(tabId) {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('active');
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('isAdmin');
    window.isAdmin = false;
});

// Hero Slider logic with 5-Second Autoplay
let currentHeroSlide = 0;
const totalHeroSlides = 2;
let heroSliderInterval;

window.setHeroSlide = function(index) {
    if (index < 0 || index >= totalHeroSlides) return;
    currentHeroSlide = index;
    
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.style.transform = `translateX(-${index * 50}%)`;
    }
    
    // Toggle active class on slide elements
    const slides = document.querySelectorAll('.hero-slide');
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    const dots = document.querySelectorAll('.hero-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    resetHeroSliderTimer();
}

function resetHeroSliderTimer() {
    clearInterval(heroSliderInterval);
    heroSliderInterval = setInterval(() => {
        let next = (currentHeroSlide + 1) % totalHeroSlides;
        window.setHeroSlide(next);
    }, 5000); // Natural 5-second interval for optimal readability and dynamic transitions
}

// Start autoplay timer on load
resetHeroSliderTimer();
