const initialMachines = [
    {
        id: "1",
        name: "DOOSAN PUMA GT 2100",
        maker: "DOOSAN",
        model: "GT 2100",
        year: "2019",
        category: "cnc",
        status: "onsale",
        image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800",
        specs: [
            { label: "최대 가공경", value: "390 mm" },
            { label: "최대 가공길이", value: "562 mm" },
            { label: "척 사이즈", value: "8 inch" }
        ]
    }
];

const initialPosts = [
    {
        id: "1",
        title: "서종기계 홈페이지 리뉴얼 안내",
        author: "관리자",
        date: "2024-05-11",
        views: 125,
        content: "안녕하세요, 서종기계입니다. 고객님들께 더 나은 서비스를 제공하고자 홈페이지를 전면 리뉴얼하였습니다. 많은 이용 부탁드립니다."
    }
];

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

class InventoryManager {
    constructor() {
        this.machines = [];
        this.grid = document.getElementById('inventory-grid');
        this.categoryBtns = document.querySelectorAll('.filter-btn');
        this.searchInput = document.getElementById('machine-search');
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.currentSlideIndex = 0;
        this.currentImageUrlsCount = 0;

        this.init();
    }

    async init() {
        // 1. Bind events immediately so categories are clickable right away
        this.bindEvents();
        
        // 2. Load from local cache or default data for instant rendering
        try {
            this.machines = JSON.parse(localStorage.getItem('machines')) || initialMachines;
        } catch (e) {
            console.error("Local Cache Parse Error:", e);
            this.machines = initialMachines;
        }
        this.render();

        // 3. Load from Firestore asynchronously in the background
        this.loadAsync();
    }

    async loadAsync() {
        if (window.db) {
            try {
                // Set a 4-second timeout race to prevent hanging
                const fetchPromise = window.db.collection('machines').get();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Firestore Timeout")), 4000)
                );
                
                const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
                const dbMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (dbMachines.length > 0) {
                    this.machines = dbMachines;
                    localStorage.setItem('machines', JSON.stringify(this.machines));
                    this.render();
                }
            } catch (e) {
                console.error("Firestore Async Load Error, falling back to cache:", e);
            }
        }
    }

    bindEvents() {
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.render();
                }
            });
        }

        const searchIcon = document.querySelector('.search-box i, .search-box svg');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                if (this.searchInput) {
                    this.searchTerm = this.searchInput.value.toLowerCase();
                    this.render();
                }
            });
        }
    }

    render() {
        if (!this.grid) return;
        const lang = window.currentLang || 'ko';
        const searchWords = this.searchTerm.split(/\s+/).filter(Boolean);
        const filtered = this.machines.filter(m => {
            if (!m) return false;
            const searchName = String(m[`name_${lang}`] || m.name || "").toLowerCase();
            const searchMaker = String(m[`maker_${lang}`] || m.maker || "").toLowerCase();
            const searchModel = String(m[`model_${lang}`] || m.model || "").toLowerCase();

            const status = m.status || 'onsale';
            const isCompletedOrSold = status === 'completed' || status === 'sold';
            let matchesCat = false;

            if (this.currentFilter === 'all') {
                // 1. [전체] 버튼 기능 확장 (거래완료 포함): 다 보여줌
                matchesCat = true;
            } else if (this.currentFilter === 'active') {
                // 2. [판매중] 버튼 (거래완료 제외): status가 completed, sold가 아닌 것
                matchesCat = !isCompletedOrSold;
            } else if (this.currentFilter === 'completed') {
                // [거래완료] 버튼: 카테고리와 상관없이 오직 거래완료 상태인 것
                matchesCat = isCompletedOrSold;
            } else {
                // cnc, mct, press, grind 등 특정 카테고리: 카테고리가 일치하는 모든 매물 (판매중 + 거래완료)
                matchesCat = (m.category === this.currentFilter);
            }

            const combinedText = `${searchName} ${searchMaker} ${searchModel}`;
            const matchesSearch = searchWords.every(word => combinedText.includes(word));

            return matchesCat && matchesSearch;
        });

        this.grid.innerHTML = filtered.map(m => {
            if (!m) return '';
            const name = String(m[`name_${lang}`] || m.name || '');
            const maker = String(m[`maker_${lang}`] || m.maker || '');
            const model = String(m[`model_${lang}`] || m.model || '');
            const status = m.status || 'onsale';
            return `
            <div class="machine-card" onclick="window.inventoryManager.showDetail('${m.id}')">
                <div class="img-container">
                    <span class="status-tag status-${status}">${this.getStatusText(status)}</span>
                    <img src="${m.image || ''}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/600x400/f8f9fa/111827?text=Machine+Image'">
                </div>
                <div class="card-content">
                    <div class="maker">${maker}</div>
                    <h3>${name}</h3>
                    <div class="card-info">
                        <span>${m.year || ''}</span>
                        <span>${lang === 'ko' ? '모델' : 'Model'}: ${model}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    getStatusText(status) {
        const lang = window.currentLang || 'ko';
        const map = {
            onsale: { ko: '판매중', en: 'On Sale', cn: '销售中' },
            reserved: { ko: '예약중', en: 'Reserved', cn: '已预订' },
            sold: { ko: '판매완료', en: 'Sold Out', cn: '已售罄' },
            completed: { ko: '거래완료', en: 'Completed', cn: '交易完成' }
        };
        return map[status] && map[status][lang] ? map[status][lang] : status;
    }

    showDetail(id) {
        const machine = this.machines.find(m => String(m.id) === String(id));
        if (!machine) return;

        const lang = window.currentLang || 'ko';
        const name = String(machine[`name_${lang}`] || machine.name || '');
        const maker = String(machine[`maker_${lang}`] || machine.maker || '');
        const model = String(machine[`model_${lang}`] || machine.model || '');
        const description = String(machine[`description_${lang}`] || machine.description || '');
        
        let currentSpecs = [];
        if (lang === 'ko') currentSpecs = machine.specs || [];
        else if (lang === 'en') {
            currentSpecs = Array.isArray(machine.specs_en) && machine.specs_en.length > 0 
                ? machine.specs_en 
                : (Array.isArray(machine.specs) ? machine.specs : []);
        } else if (lang === 'cn') {
            currentSpecs = Array.isArray(machine.specs_cn) && machine.specs_cn.length > 0 
                ? machine.specs_cn 
                : (Array.isArray(machine.specs) ? machine.specs : []);
        }

        const texts = {
            ko: {
                visit: '방문 전 연락 바랍니다', inquiry: '기계 문의 요청',
                inqDesc: '해당 기종에 대해 궁금하신 점을 상담해드립니다.',
                call: '전화 상담 연결', msg: '온라인 문의 남기기', delete: '매물 삭제 (관리자)',
                thMaker: '제조사', thModel: '모델명', thYear: '제조년도',
                thStatus: '상태', thLoc: '기계 위치', defaultLoc: '경기도 시흥시 오이도로 21',
                descriptionTitle: '상세 설명'
            },
            en: {
                visit: 'Please contact us before visiting', inquiry: 'Inquiry',
                inqDesc: 'Feel free to ask any questions about this machine.',
                call: 'Call for Inquiry', msg: 'Send Online Message', delete: 'Delete (Admin)',
                thMaker: 'Maker', thModel: 'Model', thYear: 'Year',
                thStatus: 'Status', thLoc: 'Location', defaultLoc: '21 Oido-ro, Siheung-si, Gyeonggi-do',
                descriptionTitle: 'Description'
            },
            cn: {
                visit: '来访前请提前联系', inquiry: '机器咨询',
                inqDesc: '如果您对该机器有任何疑问，请随时联系我们。',
                call: '电话咨询', msg: '发送在线留言', delete: '删除 (管理员)',
                thMaker: '制造商', thModel: '型号', thYear: '制造年份',
                thStatus: '状态', thLoc: '位置', defaultLoc: '京畿道始兴市乌耳岛路21',
                descriptionTitle: '详细描述'
            }
        };
        const t = texts[lang] || texts.ko;

        const isCompletedOrSold = machine.status === 'completed' || machine.status === 'sold';

        const rows = [];
        if (maker) rows.push(`<tr><th>${t.thMaker}</th><td>${escapeHtml(maker)}</td></tr>`);
        if (model) rows.push(`<tr><th>${t.thModel}</th><td>${escapeHtml(model)}</td></tr>`);
        if (machine.year) rows.push(`<tr><th>${t.thYear}</th><td>${escapeHtml(machine.year)}</td></tr>`);
        if (machine.status) rows.push(`<tr><th>${t.thStatus}</th><td>${this.getStatusText(machine.status)}</td></tr>`);
        if (machine.address && !isCompletedOrSold) {
            rows.push(`<tr><th>${t.thLoc}</th><td>${escapeHtml(machine.address)}</td></tr>`);
        }
        
        if (Array.isArray(currentSpecs)) {
            currentSpecs.forEach(s => {
                if (s && s.value) {
                    rows.push(`<tr><th>${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`);
                }
            });
        }

        const noticeHtml = isCompletedOrSold ? '' : `
            <p class="notice-text-sm" style="color: var(--primary); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="info" style="width:16px;"></i> ${t.visit}
            </p>
        `;
        
        const completedDesc = {
            ko: '본 매물은 거래가 완료되었습니다. 다른 매물을 확인하시거나 새로운 문의를 남겨주세요.',
            en: 'This listing is completed. Please check other inventory or submit a new inquiry.',
            cn: '该机器交易已完成。请查看其他库存或提交新咨询。'
        }[lang] || '';
        
        let inquiryHtml = '';
        if (isCompletedOrSold) {
            const completedText = {
                ko: '거래가 완료된 매물입니다',
                en: 'Transaction Completed',
                cn: '交易已完成'
            }[lang] || '거래가 완료된 매물입니다';
            
            inquiryHtml = `
                <div style="text-align: center; padding: 20px; background: rgba(0,0,0,0.05); border-radius: 8px; color: var(--text-dim); font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <i data-lucide="check-circle" style="width: 24px; height: 24px; color: var(--text-dim);"></i>
                    <span>${completedText}</span>
                </div>
            `;
        } else {
            inquiryHtml = `
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <a href="tel:010-3846-0536" class="btn-primary w-full" style="text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="phone"></i> ${t.call}
                    </a>
                    <button class="btn-secondary w-full" onclick="window.showPage('#contact'); document.querySelector('.modal').classList.remove('active')">${t.msg}</button>
                </div>
            `;
        }

        let adminControlsHtml = '';
        if (localStorage.getItem('isAdmin') === 'true') {
            adminControlsHtml = `
                <div style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 15px; background: var(--light-surface); border-radius: 8px;">
                    <button class="btn-outline" style="color: red; border-color: rgba(255,0,0,0.2);" onclick="window.inventoryManager.deleteMachine('${machine.id}')">${t.delete}</button>
                    <button class="btn-outline" style="color: var(--primary); border-color: rgba(62,176,73,0.2);" onclick="window.inventoryManager.editMachine('${machine.id}')">수정하기</button>
                    <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-dim);">상태 변경:</span>
                        <select onchange="window.inventoryManager.updateMachineStatus('${machine.id}', this.value)" style="padding: 6px 12px; border-radius: 6px; background: white; border: 1px solid var(--border); font-size: 13px; font-weight: 600; cursor: pointer;">
                            <option value="onsale" ${machine.status === 'onsale' ? 'selected' : ''}>판매중</option>
                            <option value="reserved" ${machine.status === 'reserved' ? 'selected' : ''}>예약중</option>
                            <option value="completed" ${machine.status === 'completed' ? 'selected' : ''}>거래완료</option>
                        </select>
                    </div>
                </div>
            `;
        }

        const imageUrls = Array.isArray(machine.imageUrls) && machine.imageUrls.length > 0
            ? machine.imageUrls
            : (machine.image ? [machine.image] : []);

        this.currentSlideIndex = 0;
        this.currentImageUrlsCount = imageUrls.length;

        const imageSliderHtml = imageUrls.length > 0 ? `
            <div class="carousel-container">
                <div class="carousel-slides">
                    ${imageUrls.map((url, idx) => `
                        <div class="carousel-slide">
                            <img src="${url}" alt="${escapeHtml(name)} 이미지 ${idx + 1}" onerror="this.src='https://placehold.co/600x400/f8f9fa/111827?text=No+Image'">
                        </div>
                    `).join('')}
                </div>
                ${imageUrls.length > 1 ? `
                    <button class="carousel-btn prev-btn" onclick="window.inventoryManager.prevSlide()">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <button class="carousel-btn next-btn" onclick="window.inventoryManager.nextSlide()">
                        <i data-lucide="chevron-right"></i>
                    </button>
                    <div class="carousel-indicators">
                        ${imageUrls.map((_, idx) => `
                            <span class="carousel-indicator ${idx === 0 ? 'active' : ''}" onclick="window.inventoryManager.setSlide(${idx})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        ` : `
            <img src="https://placehold.co/600x400/f8f9fa/111827?text=No+Image" class="detail-img" alt="${escapeHtml(name)}">
        `;

        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div class="detail-grid">
                <div>
                    ${imageSliderHtml}
                    <div class="quick-inquiry">
                        ${noticeHtml}
                        <h4>${t.inquiry}</h4>
                        <p>${isCompletedOrSold ? completedDesc : t.inqDesc}</p>
                        ${inquiryHtml}
                    </div>
                </div>
                <div>
                    <h2 style="font-size:32px; margin-bottom:20px;">${name}</h2>
                    ${adminControlsHtml}
                    ${rows.length > 0 ? `<table class="specs-table">${rows.join('')}</table>` : ''}
                    ${description ? `
                        <div class="detail-description">
                            <h4>${t.descriptionTitle}</h4>
                            <p>${escapeHtml(description)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        // Re-initialize Lucide icons for the newly injected HTML
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('detail-modal').classList.add('active');
    }

    setSlide(index) {
        if (index < 0 || index >= this.currentImageUrlsCount) return;
        this.currentSlideIndex = index;
        
        const slides = document.querySelector('.carousel-slides');
        if (slides) {
            slides.style.transform = `translateX(-${index * 100}%)`;
        }
        
        const indicators = document.querySelectorAll('.carousel-indicator');
        indicators.forEach((ind, i) => {
            ind.classList.toggle('active', i === index);
        });
    }

    prevSlide() {
        let index = this.currentSlideIndex - 1;
        if (index < 0) index = this.currentImageUrlsCount - 1;
        this.setSlide(index);
    }

    nextSlide() {
        let index = this.currentSlideIndex + 1;
        if (index >= this.currentImageUrlsCount) index = 0;
        this.setSlide(index);
    }

    async addMachine(data) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        
        const parseSpecs = (str) => {
            if (!str) return [];
            return str.split('\n').filter(s => s.includes(':')).map(s => {
                const [label, ...value] = s.split(':');
                return { label: label.trim(), value: value.join(':').trim() };
            });
        };

        const specs = parseSpecs(data.specs);
        const specs_en = parseSpecs(data.specs_en);
        const specs_cn = parseSpecs(data.specs_cn);

        const newMachine = { ...data, specs, specs_en, specs_cn, createdAt: Date.now() };

        if (window.db) {
            const docRef = await window.db.collection('machines').add(newMachine);
            this.machines.unshift({ id: docRef.id, ...newMachine });
        } else {
            const id = Date.now().toString();
            this.machines.unshift({ id, ...newMachine });
            localStorage.setItem('machines', JSON.stringify(this.machines));
        }
        this.render();
    }

    async deleteMachine(id) {
        if (!confirm('정말 이 매물을 삭제하시겠습니까?')) return;
        if (window.db) {
            await window.db.collection('machines').doc(id).delete();
        }
        this.machines = this.machines.filter(m => String(m.id) !== String(id));
        localStorage.setItem('machines', JSON.stringify(this.machines));
        this.render();
        document.querySelector('.modal').classList.remove('active');
    }

    async updateMachineStatus(id, newStatus) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        const machine = this.machines.find(m => String(m.id) === String(id));
        if (!machine) return;
        
        machine.status = newStatus;
        
        if (window.db) {
            try {
                await window.db.collection('machines').doc(id).update({ status: newStatus });
            } catch (e) {
                console.error("Firestore Status Update Error:", e);
            }
        }
        localStorage.setItem('machines', JSON.stringify(this.machines));
        
        alert('상태가 성공적으로 변경되었습니다.');
        this.render();
        this.showDetail(id); // Refresh detail popup
    }

    editMachine(id) {
        const machine = this.machines.find(m => String(m.id) === String(id));
        if (!machine) return;

        window.editingMachineId = id;
        
        // Hide detail modal first
        document.getElementById('detail-modal').classList.remove('active');

        // Populate fields in machineForm
        const form = document.getElementById('add-machine-form');
        if (form) {
            form.querySelector('[name="name"]').value = machine.name || '';
            form.querySelector('[name="category"]').value = machine.category || 'cnc';
            form.querySelector('[name="status"]').value = machine.status || 'onsale';
            form.querySelector('[name="maker"]').value = machine.maker || '';
            form.querySelector('[name="model"]').value = machine.model || '';
            form.querySelector('[name="year"]').value = machine.year || '';
            
            // Format specs back to textarea format (label: value)
            let specsText = '';
            if (Array.isArray(machine.specs)) {
                specsText = machine.specs.map(s => `${s.label}: ${s.value}`).join('\n');
            }
            form.querySelector('[name="specs"]').value = specsText;
            form.querySelector('[name="description"]').value = machine.description || '';
            
            // EN
            form.querySelector('[name="name_en"]').value = machine.name_en || '';
            form.querySelector('[name="maker_en"]').value = machine.maker_en || '';
            form.querySelector('[name="model_en"]').value = machine.model_en || '';
            let specsTextEn = '';
            if (Array.isArray(machine.specs_en)) {
                specsTextEn = machine.specs_en.map(s => `${s.label}: ${s.value}`).join('\n');
            }
            form.querySelector('[name="specs_en"]').value = specsTextEn;
            form.querySelector('[name="description_en"]').value = machine.description_en || '';

            // CN
            form.querySelector('[name="name_cn"]').value = machine.name_cn || '';
            form.querySelector('[name="maker_cn"]').value = machine.maker_cn || '';
            form.querySelector('[name="model_cn"]').value = machine.model_cn || '';
            let specsTextCn = '';
            if (Array.isArray(machine.specs_cn)) {
                specsTextCn = machine.specs_cn.map(s => `${s.label}: ${s.value}`).join('\n');
            }
            form.querySelector('[name="specs_cn"]').value = specsTextCn;
            form.querySelector('[name="description_cn"]').value = machine.description_cn || '';

            form.querySelector('[name="address"]').value = machine.address || '';

            // Render existing images preview
            const preview = document.getElementById('machine-image-preview');
            if (preview && Array.isArray(machine.imageUrls) && machine.imageUrls.length > 0) {
                preview.innerHTML = machine.imageUrls.map((url, idx) => `
                    <div class="upload-preview-item">
                        <img src="${url}" alt="기존 이미지 ${idx + 1}">
                        <span>기존 이미지 ${idx + 1}</span>
                    </div>
                `).join('');
            } else if (preview && machine.image) {
                preview.innerHTML = `
                    <div class="upload-preview-item">
                        <img src="${machine.image}" alt="기존 이미지">
                        <span>기존 이미지</span>
                    </div>
                `;
            } else if (preview) {
                preview.innerHTML = '';
            }

            // Set submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerText = '매물 수정 완료';
            }

            // Open Admin modal tab
            window.openAdminTab('add-machine-form');
        }
    }

    async updateMachine(id, data) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        
        const parseSpecs = (str) => {
            if (!str) return [];
            return str.split('\n').filter(s => s.includes(':')).map(s => {
                const [label, ...value] = s.split(':');
                return { label: label.trim(), value: value.join(':').trim() };
            });
        };

        const specs = parseSpecs(data.specs);
        const specs_en = parseSpecs(data.specs_en);
        const specs_cn = parseSpecs(data.specs_cn);

        const updatedFields = { ...data, specs, specs_en, specs_cn };

        const machineIndex = this.machines.findIndex(m => String(m.id) === String(id));
        if (machineIndex !== -1) {
            this.machines[machineIndex] = { ...this.machines[machineIndex], ...updatedFields };
        }

        if (window.db) {
            try {
                await window.db.collection('machines').doc(id).update(updatedFields);
            } catch (e) {
                console.error("Firestore Update Error:", e);
            }
        }
        localStorage.setItem('machines', JSON.stringify(this.machines));
        
        this.render();
        this.showDetail(id); // Re-open details popup to show updated info!
    }

    openPostcode() {
        new daum.Postcode({
            oncomplete: function(data) {
                const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
                document.getElementById('machine-address').value = addr;
            }
        }).open();
    }
}

class BoardManager {
    constructor() {
        this.posts = [];
        this.listElement = document.getElementById('board-list');
        this.init();
    }

    async init() {
        await this.load();
        this.render();
    }

    async load() {
        if (window.db) {
            const snapshot = await window.db.collection('posts').orderBy('date', 'desc').get();
            this.posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (this.posts.length === 0) this.posts = initialPosts;
        } else {
            try {
                this.posts = JSON.parse(localStorage.getItem('posts')) || initialPosts;
            } catch (e) {
                console.error("Local Cache Posts Parse Error:", e);
                this.posts = initialPosts;
            }
        }
    }

    render() {
        if (!this.listElement) return;
        const lang = window.currentLang || 'ko';
        this.listElement.innerHTML = this.posts.map((p, idx) => {
            const title = p[`title_${lang}`] || p.title || '';
            return `
            <tr onclick="window.boardManager.showPost('${p.id}')">
                <td>${this.posts.length - idx}</td>
                <td>
                    ${p.coverImage ? `<img class="board-thumb" src="${escapeHtml(p.coverImage)}" alt="${escapeHtml(title)}">` : ''}
                </td>
                <td style="font-weight:600;">${escapeHtml(title)}</td>
                <td>${p.date}</td>
            </tr>
        `}).join('');
    }

    async showPost(id) {
        const post = this.posts.find(p => String(p.id) === String(id));
        if (!post) return;
        
        // Update views
        post.views = (post.views || 0) + 1;
        if (window.db && !/^\d+$/.test(String(id))) {
            window.db.collection('posts').doc(id).update({ views: post.views }).catch(error => {
                console.warn('Post view update skipped:', error);
            });
        }
        localStorage.setItem('posts', JSON.stringify(this.posts));
        this.render();

        const lang = window.currentLang || 'ko';
        const title = post[`title_${lang}`] || post.title || '';
        const content = post[`content_${lang}`] || post.content || '';

        const body = document.getElementById('modal-body');
        const postImages = Array.isArray(post.images) ? post.images : [];
        body.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="font-size:28px; margin-bottom:10px;">${escapeHtml(title)}</h2>
                <div style="color:var(--text-dim); margin-bottom:30px; padding-bottom:20px; border-bottom:1px solid var(--border);">
                    작성자: ${escapeHtml(post.author)} | 날짜: ${post.date}
                </div>
                ${postImages.length ? `
                    <div class="post-gallery">
                        ${postImages.map((image, imageIndex) => `
                            <a href="${escapeHtml(image.url)}" target="_blank" rel="noopener" class="post-gallery-item">
                                <img src="${escapeHtml(image.url)}" alt="${escapeHtml(title)} 사진 ${imageIndex + 1}" loading="lazy" decoding="async">
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
                <div style="line-height:1.8; font-size:16px; min-height: 160px; white-space:pre-wrap;">${escapeHtml(content)}</div>

                <div style="margin-top: 40px; display: flex; gap: 10px;">
                    <button class="btn-outline" onclick="document.querySelector('.modal').classList.remove('active')">목록으로</button>
                    ${localStorage.getItem('isAdmin') === 'true' ? `<button class="btn-outline" style="color: red; border-color: rgba(255,0,0,0.2);" onclick="window.boardManager.deletePost('${id}')">삭제 (관리자)</button>` : ''}
                </div>
            </div>
        `;
        document.getElementById('detail-modal').classList.add('active');
    }

    async addComment(e, postId) {
        e.preventDefault();
        const author = document.getElementById('comment-author').value;
        const content = document.getElementById('comment-content').value;
        
        const comment = {
            author,
            content,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        if (window.db) {
            await window.db.collection('posts').doc(postId).collection('comments').add(comment);
        } else {
            const comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
            comments.push(comment);
            localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
        }
        
        this.showPost(postId);
    }

    async addPost(data) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        const newPost = { ...data, createdAt: Date.now() };

        if (window.db) {
            const docRef = await window.db.collection('posts').add(newPost);
            this.posts.unshift({ id: docRef.id, ...newPost });
        } else {
            const id = Date.now().toString();
            this.posts.unshift({ id, ...newPost });
            localStorage.setItem('posts', JSON.stringify(this.posts));
        }
        this.render();
    }

    async deletePost(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const post = this.posts.find(p => String(p.id) === String(id));
        if (window.db) {
            await window.db.collection('posts').doc(id).delete();
        }
        if (window.storage && post && Array.isArray(post.images)) {
            for (const image of post.images) {
                if (!image.storagePath) continue;
                try {
                    await window.storage.ref().child(image.storagePath).delete();
                } catch (error) {
                    console.warn('Storage image delete failed:', image.storagePath, error);
                }
            }
        }
        this.posts = this.posts.filter(p => String(p.id) !== String(id));
        localStorage.setItem('posts', JSON.stringify(this.posts));
        this.render();
        document.querySelector('.modal').classList.remove('active');
    }
}

window.inventoryManager = new InventoryManager();
window.boardManager = new BoardManager();
