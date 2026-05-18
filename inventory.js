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

        this.init();
    }

    async init() {
        await this.load();
        this.render();
        this.bindEvents();
    }

    async load() {
        if (window.db) {
            try {
                const snapshot = await window.db.collection('machines').get();
                this.machines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (this.machines.length === 0) this.machines = initialMachines;
            } catch (e) {
                console.error("Firestore Load Error:", e);
                this.machines = JSON.parse(localStorage.getItem('machines')) || initialMachines;
            }
        } else {
            this.machines = JSON.parse(localStorage.getItem('machines')) || initialMachines;
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
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.render();
            });
        }
    }

    render() {
        if (!this.grid) return;
        const lang = window.currentLang || 'ko';
        const filtered = this.machines.filter(m => {
            const searchName = (m[`name_${lang}`] || m.name || "").toLowerCase();
            const searchMaker = (m[`maker_${lang}`] || m.maker || "").toLowerCase();
            const searchModel = (m[`model_${lang}`] || m.model || "").toLowerCase();

            const matchesCat = this.currentFilter === 'all' || m.category === this.currentFilter;
            const matchesSearch = searchName.includes(this.searchTerm) || 
                                searchMaker.includes(this.searchTerm) ||
                                searchModel.includes(this.searchTerm);
            return matchesCat && matchesSearch;
        });

        this.grid.innerHTML = filtered.map(m => {
            const name = m[`name_${lang}`] || m.name || '';
            const maker = m[`maker_${lang}`] || m.maker || '';
            const model = m[`model_${lang}`] || m.model || '';
            return `
            <div class="machine-card" onclick="window.inventoryManager.showDetail('${m.id}')">
                <div class="img-container">
                    <span class="status-tag status-${m.status}">${this.getStatusText(m.status)}</span>
                    <img src="${m.image}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/600x400/f8f9fa/111827?text=Machine+Image'">
                </div>
                <div class="card-content">
                    <div class="maker">${maker}</div>
                    <h3>${name}</h3>
                    <div class="card-info">
                        <span>${m.year}</span>
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
            sold: { ko: '판매완료', en: 'Sold Out', cn: '已售罄' }
        };
        return map[status] && map[status][lang] ? map[status][lang] : status;
    }

    showDetail(id) {
        const machine = this.machines.find(m => String(m.id) === String(id));
        if (!machine) return;

        const lang = window.currentLang || 'ko';
        const name = machine[`name_${lang}`] || machine.name || '';
        const maker = machine[`maker_${lang}`] || machine.maker || '';
        const model = machine[`model_${lang}`] || machine.model || '';
        
        let currentSpecs = [];
        if (lang === 'ko') currentSpecs = machine.specs || [];
        else if (lang === 'en') currentSpecs = machine.specs_en && machine.specs_en.length > 0 ? machine.specs_en : (machine.specs || []);
        else if (lang === 'cn') currentSpecs = machine.specs_cn && machine.specs_cn.length > 0 ? machine.specs_cn : (machine.specs || []);

        const texts = {
            ko: {
                visit: '방문 전 연락 바랍니다', inquiry: '기계 문의 요청',
                inqDesc: '해당 기종에 대해 궁금하신 점을 상담해드립니다.',
                call: '전화 상담 연결', msg: '온라인 문의 남기기', delete: '매물 삭제 (관리자)',
                thMaker: '제조사', thModel: '모델명', thYear: '제조년도',
                thStatus: '상태', thLoc: '기계 위치', defaultLoc: '경기도 시흥시 오이도로 21'
            },
            en: {
                visit: 'Please contact us before visiting', inquiry: 'Inquiry',
                inqDesc: 'Feel free to ask any questions about this machine.',
                call: 'Call for Inquiry', msg: 'Send Online Message', delete: 'Delete (Admin)',
                thMaker: 'Maker', thModel: 'Model', thYear: 'Year',
                thStatus: 'Status', thLoc: 'Location', defaultLoc: '21 Oido-ro, Siheung-si, Gyeonggi-do'
            },
            cn: {
                visit: '来访前请提前联系', inquiry: '机器咨询',
                inqDesc: '如果您对该机器有任何疑问，请随时联系我们。',
                call: '电话咨询', msg: '发送在线留言', delete: '删除 (管理员)',
                thMaker: '制造商', thModel: '型号', thYear: '制造年份',
                thStatus: '状态', thLoc: '位置', defaultLoc: '京畿道始兴市乌耳岛路21'
            }
        };
        const t = texts[lang] || texts.ko;

        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div class="detail-grid">
                <div>
                    <img src="${machine.image}" class="detail-img" alt="${name}">
                    <div class="quick-inquiry">
                        <p class="notice-text-sm" style="color: var(--primary); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="info" style="width:16px;"></i> ${t.visit}
                        </p>
                        <h4>${t.inquiry}</h4>
                        <p>${t.inqDesc}</p>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <a href="tel:010-3846-0536" class="btn-primary w-full" style="text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i data-lucide="phone"></i> ${t.call}
                            </a>
                            <button class="btn-secondary w-full" onclick="window.showPage('#contact'); document.querySelector('.modal').classList.remove('active')">${t.msg}</button>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 style="font-size:32px; margin-bottom:20px;">${name}</h2>
                    <div style="margin-bottom: 20px;">
                        ${localStorage.getItem('isAdmin') === 'true' ? `<button class="btn-outline" style="color: red; border-color: rgba(255,0,0,0.2);" onclick="window.inventoryManager.deleteMachine('${machine.id}')">${t.delete}</button>` : ''}
                    </div>
                    <table class="specs-table">
                        <tr><th>${t.thMaker}</th><td>${maker}</td></tr>
                        <tr><th>${t.thModel}</th><td>${model}</td></tr>
                        <tr><th>${t.thYear}</th><td>${machine.year}</td></tr>
                        <tr><th>${t.thStatus}</th><td>${this.getStatusText(machine.status)}</td></tr>
                        <tr><th>${t.thLoc}</th><td>${machine.address || t.defaultLoc}</td></tr>
                        ${currentSpecs.map(s => `<tr><th>${s.label}</th><td>${s.value}</td></tr>`).join('')}
                    </table>
                </div>
            </div>
        `;
        // Re-initialize Lucide icons for the newly injected HTML
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('detail-modal').classList.add('active');
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
            this.posts = JSON.parse(localStorage.getItem('posts')) || initialPosts;
        }
    }

    render() {
        if (!this.listElement) return;
        this.listElement.innerHTML = this.posts.map((p, idx) => `
            <tr onclick="window.boardManager.showPost('${p.id}')">
                <td>${this.posts.length - idx}</td>
                <td>
                    ${p.coverImage ? `<img class="board-thumb" src="${escapeHtml(p.coverImage)}" alt="${escapeHtml(p.title)}">` : '<span class="board-thumb-empty">-</span>'}
                </td>
                <td style="font-weight:600;">${escapeHtml(p.title)}</td>
                <td>${p.date}</td>
                <td>${p.views || 0}</td>
            </tr>
        `).join('');
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

        const body = document.getElementById('modal-body');
        const postImages = Array.isArray(post.images) ? post.images : [];
        body.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="font-size:28px; margin-bottom:10px;">${escapeHtml(post.title)}</h2>
                <div style="color:var(--text-dim); margin-bottom:30px; padding-bottom:20px; border-bottom:1px solid var(--border);">
                    작성자: ${escapeHtml(post.author)} | 날짜: ${post.date} | 조회: ${post.views}
                </div>
                ${postImages.length ? `
                    <div class="post-gallery">
                        ${postImages.map((image, imageIndex) => `
                            <a href="${escapeHtml(image.url)}" target="_blank" rel="noopener" class="post-gallery-item">
                                <img src="${escapeHtml(image.url)}" alt="${escapeHtml(post.title)} 사진 ${imageIndex + 1}" loading="lazy" decoding="async">
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
                <div style="line-height:1.8; font-size:16px; min-height: 160px; white-space:pre-wrap;">${escapeHtml(post.content)}</div>

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
