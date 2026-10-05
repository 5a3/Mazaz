// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================
const firebaseConfig = {
    projectId: "mazaz-de904",
    // In Firebase SDK (web v9/v10 compat mode), projectId is sufficient for Firestore operations
    authDomain: "mazaz-de904.firebaseapp.com",
    storageBucket: "mazaz-de904.appspot.com"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Update connection status UI (Removing word Firebase)
const firebaseStatus = document.getElementById('firebaseStatus');
db.enablePersistence().catch(() => {}).finally(() => {
    if (firebaseStatus) {
        firebaseStatus.classList.add('connected');
        firebaseStatus.querySelector('.status-text').textContent = 'متصل (mazaz-de904)';
    }
});

// Mobile Sidebar Drawer Handlers
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
}

function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);


// Global Application State
let categories = [];
let products = [];
let adminsList = [];
let activeTab = 'categories-tab';
let currentAdmin = null; // Currently logged-in admin object { id, username, displayName, role }

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminsNavBtn = document.getElementById('adminsNavBtn');
const currentAdminName = document.getElementById('currentAdminName');
const currentAdminRoleBadge = document.getElementById('currentAdminRoleBadge');

const categoriesTableBody = document.getElementById('categoriesTableBody');
const productsTableBody = document.getElementById('productsTableBody');
const adminsTableBody = document.getElementById('adminsTableBody');
const categoryFilter = document.getElementById('categoryFilter');
const productCategorySelect = document.getElementById('productCategory');
const categoryModal = document.getElementById('categoryModal');
const productModal = document.getElementById('productModal');
const adminModal = document.getElementById('adminModal');
const categoryForm = document.getElementById('categoryForm');
const productForm = document.getElementById('productForm');
const adminForm = document.getElementById('adminForm');
const headerAddBtn = document.getElementById('headerAddBtn');
const addAdminBtn = document.getElementById('addAdminBtn');
const pricingType = document.getElementById('pricingType');
const singlePriceSection = document.getElementById('singlePriceSection');
const variantPriceSection = document.getElementById('variantPriceSection');
const addonsContainer = document.getElementById('addonsContainer');
const addAddonBtn = document.getElementById('addAddonBtn');

// ==========================================
// Utility Helper Functions (Toasts, Spinners, Dialogs)
// ==========================================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setButtonLoading(btn, isLoading, loadingText = '') {
    if (!btn) return;
    const spinner = btn.querySelector('.btn-spinner');
    const textSpan = btn.querySelector('.btn-text');

    if (isLoading) {
        btn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (textSpan) {
            btn.dataset.originalText = textSpan.innerHTML;
            if (loadingText) textSpan.textContent = loadingText;
        }
    } else {
        btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (textSpan && btn.dataset.originalText) {
            textSpan.innerHTML = btn.dataset.originalText;
        }
    }
}

function showConfirmDialog(title, message, onConfirm) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');

    if (!confirmModal) return;

    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmMessage) confirmMessage.textContent = message;

    confirmModal.classList.add('active');

    const handleOk = async () => {
        setButtonLoading(confirmOkBtn, true);
        try {
            await onConfirm();
        } finally {
            setButtonLoading(confirmOkBtn, false);
            confirmModal.classList.remove('active');
            confirmOkBtn.removeEventListener('click', handleOk);
        }
    };

    const handleCancel = () => {
        confirmModal.classList.remove('active');
        confirmOkBtn.removeEventListener('click', handleOk);
        confirmCancelBtn.removeEventListener('click', handleCancel);
    };

    confirmOkBtn.addEventListener('click', handleOk);
    confirmCancelBtn.addEventListener('click', handleCancel);
}

// ==========================================
// 1. Authentication & Session System
// ==========================================
function checkSession() {
    const savedUser = localStorage.getItem('mazaz_admin_user');
    if (savedUser) {
        try {
            currentAdmin = JSON.parse(savedUser);
            showDashboard();
        } catch (e) {
            showLogin();
        }
    } else {
        showLogin();
    }
}

function showLogin() {
    currentAdmin = null;
    localStorage.removeItem('mazaz_admin_user');
    if (loginOverlay) loginOverlay.classList.add('active');
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showDashboard() {
    if (loginOverlay) loginOverlay.classList.remove('active');
    if (adminDashboard) adminDashboard.style.display = 'flex';

    // Update Sidebar Admin Badge
    if (currentAdminName) currentAdminName.textContent = currentAdmin.displayName || currentAdmin.username;
    if (currentAdminRoleBadge) {
        currentAdminRoleBadge.textContent = currentAdmin.role === 'superadmin' ? 'مدير عام (Superadmin)' : 'مدير عادي (Admin)';
        currentAdminRoleBadge.className = `role-badge ${currentAdmin.role}`;
    }

    // Role Security Enforcement (Superadmin vs Admin)
    if (currentAdmin.role === 'superadmin') {
        if (adminsNavBtn) adminsNavBtn.style.display = 'flex';
        listenToAdmins();
    } else {
        if (adminsNavBtn) adminsNavBtn.style.display = 'none';
    }

    // Smart Caching Data Load (Minimizes Firestore Reads to 1 Document Check)
    loadDataSmartly();
}

// Login Form Submit Handler
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            showToast('يرجى كتابة اسم المستخدم وكلمة المرور', 'error');
            return;
        }

        setButtonLoading(loginSubmitBtn, true, 'جاري التحقق...');

        try {
            // Step 1: Search by username first to give explicit error message
            const userCheck = await db.collection('admins')
                .where('username', '==', username)
                .get();

            if (userCheck.empty) {
                showToast(`اسم المستخدم "${username}" غير موجود! يرجى التأكد من الاسم`, 'error');
                loginUsername.focus();
                return;
            }

            const userDoc = userCheck.docs[0];
            const userData = userDoc.data();

            // Step 2: Check password match
            if (userData.password !== password) {
                showToast('كلمة المرور غير صحيحة! يرجى إعادة المحاولة', 'error');
                loginPassword.value = '';
                loginPassword.focus();
                return;
            }

            // Login Success
            currentAdmin = {
                id: userDoc.id,
                displayName: userData.displayName || userData.username,
                username: userData.username,
                role: userData.role || 'admin'
            };
            localStorage.setItem('mazaz_admin_user', JSON.stringify(currentAdmin));
            showToast(`أهلاً بك ${currentAdmin.displayName}! تم تسجيل الدخول بنجاح`, 'success');
            showDashboard();

        } catch (err) {
            console.error('Login error:', err);
            showToast('حدث خطأ أثناء الاتصال: ' + err.message, 'error');
        } finally {
            setButtonLoading(loginSubmitBtn, false);
        }
    });
}

// Logout Button Handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        showToast('تم تسجيل الخروج بنجاح', 'info');
        showLogin();
    });
}

// Check session on app load
checkSession();

// ==========================================
// 2. Navigation & Tab Switching
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        const targetTab = btn.getAttribute('data-tab');
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        activeTab = targetTab;

        // Auto close mobile drawer on tab selection
        closeMobileSidebar();

        // Update Header Titles & Buttons
        if (targetTab === 'categories-tab') {
            document.getElementById('currentPageTitle').textContent = 'إدارة الأقسام';
            document.getElementById('currentPageSub').textContent = 'إضافة وتعديل وترتيب أقسام المنيو';
            headerAddBtn.style.display = 'inline-flex';
            document.getElementById('headerAddBtnText').textContent = 'إضافة قسم جديد';
        } else if (targetTab === 'products-tab') {
            document.getElementById('currentPageTitle').textContent = 'إدارة المنتجات';
            document.getElementById('currentPageSub').textContent = 'إضافة وتعديل المنتجات وأسعار الصغير والكبير والإضافات';
            headerAddBtn.style.display = 'inline-flex';
            document.getElementById('headerAddBtnText').textContent = 'إضافة منتج جديد';
        } else if (targetTab === 'admins-tab') {
            document.getElementById('currentPageTitle').textContent = 'إدارة المدراء';
            document.getElementById('currentPageSub').textContent = 'إدارة حسابات المسؤولين والأدوار والصلات';
            headerAddBtn.style.display = 'none';
        } else {
            document.getElementById('currentPageTitle').textContent = 'إدخال البيانات الأولية';
            document.getElementById('currentPageSub').textContent = 'رفع بيانات منيو مزاز الكاملة تلقائياً';
            headerAddBtn.style.display = 'none';
        }
    });
});

// Header Add Button Click
headerAddBtn.addEventListener('click', () => {
    if (activeTab === 'categories-tab') {
        openCategoryModal();
    } else if (activeTab === 'products-tab') {
        openProductModal();
    }
});

// Modal Close Triggers
document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId).classList.remove('active');
    });
});

// Toggle Pricing Fields in Product Modal
pricingType.addEventListener('change', (e) => {
    if (e.target.value === 'single') {
        singlePriceSection.style.display = 'block';
        variantPriceSection.style.display = 'none';
    } else {
        singlePriceSection.style.display = 'none';
        variantPriceSection.style.display = 'block';
    }
});

// Add Addon Row Handler
addAddonBtn.addEventListener('click', () => {
    addAddonRow('', '');
});

function addAddonRow(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'addon-row';
    row.innerHTML = `
        <input type="text" class="form-control addon-name" placeholder="اسم الإضافة (مثال: إضافة جبن)" value="${name}">
        <input type="number" class="form-control addon-price" placeholder="السعر" value="${price}" style="max-width: 120px;">
        <button type="button" class="btn btn-danger btn-sm remove-addon-btn"><i class="fa-solid fa-trash"></i></button>
    `;
    row.querySelector('.remove-addon-btn').addEventListener('click', () => row.remove());
    addonsContainer.appendChild(row);
}

// ==========================================
// 4. Smart Local Caching System (Firestore Optimization)
// ==========================================

// Update Metadata Timestamp in Firestore (1 Write call on changes)
async function touchSystemMetadata() {
    try {
        const now = Date.now();
        await db.collection('system_metadata').doc('version').set({
            last_updated_at: firebase.firestore.Timestamp.fromMillis(now)
        }, { merge: true });
        localStorage.setItem('mazaz_last_sync', now.toString());
        return now;
    } catch (e) {
        console.warn('Metadata touch error:', e);
        return Date.now();
    }
}

// Save & Read Local Cache
function setLocalCache(key, data) {
    try {
        localStorage.setItem(`mazaz_cache_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('Cache write failed:', e);
    }
}

function getLocalCache(key) {
    try {
        const cached = localStorage.getItem(`mazaz_cache_${key}`);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
}

// Load Data Smartly: Checks 1 document (version metadata) instead of reading full DB
async function loadDataSmartly() {
    const cachedCategories = getLocalCache('categories');
    const cachedProducts = getLocalCache('products');
    const localSyncTime = parseInt(localStorage.getItem('mazaz_last_sync') || '0');

    // If cache exists, render immediately for instantaneous UI loading
    if (cachedCategories && cachedProducts) {
        categories = cachedCategories;
        products = cachedProducts;
        renderCategoriesTable();
        populateCategoryDropdowns();
        renderProductsTable();
    }

    try {
        // Step 1: Read ONLY ONE document to check last system update (1 Read)
        const metaDoc = await db.collection('system_metadata').doc('version').get();
        let serverSyncTime = 0;

        if (metaDoc.exists && metaDoc.data().last_updated_at) {
            serverSyncTime = metaDoc.data().last_updated_at.toMillis();
        }

        // Step 2: Compare timestamps. Fetch only if server data is newer or cache is missing
        if (!cachedCategories || !cachedProducts || serverSyncTime > localSyncTime) {
            await fetchFreshDataFromFirebase();
            localStorage.setItem('mazaz_last_sync', (serverSyncTime || Date.now()).toString());
        }
    } catch (err) {
        console.error('Smart cache error, fallback to fresh fetch:', err);
        if (!cachedCategories || !cachedProducts) {
            await fetchFreshDataFromFirebase();
        }
    }
}

// Fresh fetch when cache is invalid
async function fetchFreshDataFromFirebase() {
    try {
        const [catSnapshot, prodSnapshot] = await Promise.all([
            db.collection('categories').orderBy('order', 'asc').get(),
            db.collection('products').orderBy('order', 'asc').get()
        ]);

        categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        products = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setLocalCache('categories', categories);
        setLocalCache('products', products);

        renderCategoriesTable();
        populateCategoryDropdowns();
        renderProductsTable();
    } catch (err) {
        console.error("Error fetching fresh data:", err);
        showToast("خطأ في الاتصال بالسيرفر: " + err.message, "error");
    }
}

function listenToAdmins() {
    db.collection('admins').onSnapshot(snapshot => {
        adminsList = [];
        snapshot.forEach(doc => {
            adminsList.push({ id: doc.id, ...doc.data() });
        });
        renderAdminsTable();
    }, err => {
        console.error("Error fetching admins:", err);
    });
}

// ==========================================
// 5. Render Tables & Views
// ==========================================
function renderCategoriesTable() {
    document.getElementById('categoriesCount').textContent = `${categories.length} قسم`;
    if (categories.length === 0) {
        categoriesTableBody.innerHTML = `<tr><td colspan="6" class="text-center loading-cell">لا يوجد أقسام حالياً.</td></tr>`;
        return;
    }

    let html = '';
    categories.forEach(cat => {
        const prodCount = products.filter(p => p.category_id === cat.id).length;
        const statusBadge = cat.is_active !== false ?
            `<span class="badge" style="background:#E8F8F0; color:#2ECC71;">نشط</span>` :
            `<span class="badge" style="background:#FEE2E2; color:#EF4444;">مخفي</span>`;

        const updatedBy = cat.updated_by_name || 'النظام (أولي)';

        html += `
            <tr>
                <td><strong>#${cat.order || 1}</strong></td>
                <td><strong>${cat.name_ar}</strong></td>
                <td>${prodCount} منتج</td>
                <td><span class="updated-by-tag"><i class="fa-solid fa-user-pen"></i> ${updatedBy}</span></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editCategory('${cat.id}')">
                        <i class="fa-solid fa-pen"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                </td>
            </tr>
        `;
    });
    categoriesTableBody.innerHTML = html;
}

function populateCategoryDropdowns() {
    let filterHtml = '<option value="all">جميع الأقسام</option>';
    let modalHtml = '<option value="">اختر القسم...</option>';

    categories.forEach(cat => {
        filterHtml += `<option value="${cat.id}">${cat.name_ar}</option>`;
        modalHtml += `<option value="${cat.id}">${cat.name_ar}</option>`;
    });

    const currentFilterVal = categoryFilter.value;
    categoryFilter.innerHTML = filterHtml;
    categoryFilter.value = currentFilterVal || 'all';

    productCategorySelect.innerHTML = modalHtml;
}

categoryFilter.addEventListener('change', () => {
    renderProductsTable();
});

function renderProductsTable() {
    const selectedCat = categoryFilter.value;
    let filteredProducts = products;
    if (selectedCat !== 'all') {
        filteredProducts = products.filter(p => p.category_id === selectedCat);
    }

    document.getElementById('productsCount').textContent = `${filteredProducts.length} منتج`;

    if (filteredProducts.length === 0) {
        productsTableBody.innerHTML = `<tr><td colspan="8" class="text-center loading-cell">لا يوجد منتجات في هذا القسم.</td></tr>`;
        return;
    }

    let html = '';
    filteredProducts.forEach(prod => {
        const cat = categories.find(c => c.id === prod.category_id);
        const catName = cat ? cat.name_ar : 'غير محدد';

        // Pricing Display
        let pricingDisplay = '';
        if (prod.pricing_type === 'single') {
            pricingDisplay = `<span class="variant-tag">سعر موحد: <strong>${prod.base_price || 0}</strong></span>`;
        } else {
            const smallObj = (prod.variants || []).find(v => v.size_name === 'صغير');
            const largeObj = (prod.variants || []).find(v => v.size_name === 'كبير');
            pricingDisplay = `
                ${smallObj ? `<span class="variant-tag">صغير: <strong>${smallObj.price}</strong></span>` : ''}
                ${largeObj ? `<span class="variant-tag">كبير: <strong>${largeObj.price}</strong></span>` : ''}
            `;
        }

        // Addons Display
        let addonsDisplay = '-';
        if (prod.addons && prod.addons.length > 0) {
            addonsDisplay = prod.addons.map(a => `<span class="addon-badge">${a.name}: ${a.price}</span>`).join(' ');
        }

        const availableBadge = prod.is_available !== false ?
            `<span class="badge" style="background:#E8F8F0; color:#2ECC71;">متوفر</span>` :
            `<span class="badge" style="background:#FEE2E2; color:#EF4444;">غير متوفر</span>`;

        const updatedBy = prod.updated_by_name || 'النظام (أولي)';

        html += `
            <tr>
                <td><strong>#${prod.order || 1}</strong></td>
                <td><strong>${prod.name_ar}</strong></td>
                <td>${catName}</td>
                <td>${pricingDisplay}</td>
                <td>${addonsDisplay}</td>
                <td><span class="updated-by-tag"><i class="fa-solid fa-user-pen"></i> ${updatedBy}</span></td>
                <td>${availableBadge}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editProduct('${prod.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${prod.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    productsTableBody.innerHTML = html;
}

// Render Admins Management Table (Superadmin Only)
function renderAdminsTable() {
    if (!adminsTableBody) return;
    if (adminsList.length === 0) {
        adminsTableBody.innerHTML = `<tr><td colspan="6" class="text-center loading-cell">لا يوجد مدراء حالياً.</td></tr>`;
        return;
    }

    let html = '';
    adminsList.forEach(admin => {
        const roleBadge = admin.role === 'superadmin' ?
            `<span class="role-badge superadmin">Superadmin (مدير عام)</span>` :
            `<span class="role-badge admin">Admin (مدير عادي)</span>`;

        const createdDate = admin.created_at ? new Date(admin.created_at.seconds * 1000).toLocaleDateString('ar-SA') : 'سابقاً';

        html += `
            <tr>
                <td><strong>${admin.displayName || admin.username}</strong></td>
                <td><code>${admin.username}</code></td>
                <td><code style="background:#FFF7ED; color:#C2410C; padding:2px 6px; border-radius:4px;">${admin.password}</code></td>
                <td>${roleBadge}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAdmin('${admin.id}')">
                        <i class="fa-solid fa-pen"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdmin('${admin.id}')">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                </td>
            </tr>
        `;
    });
    adminsTableBody.innerHTML = html;
}

// ==========================================
// 6. Category CRUD Operations (With Audit Tracking)
// ==========================================
function openCategoryModal(cat = null) {
    categoryForm.reset();
    const submitBtn = document.getElementById('categorySubmitBtn');
    setButtonLoading(submitBtn, false);

    if (cat) {
        document.getElementById('categoryModalTitle').textContent = 'تعديل قسم';
        document.getElementById('categoryId').value = cat.id;
        document.getElementById('categoryName').value = cat.name_ar;
        document.getElementById('categoryOrder').value = cat.order || 1;
        document.getElementById('categoryActive').checked = cat.is_active !== false;
    } else {
        document.getElementById('categoryModalTitle').textContent = 'إضافة قسم جديد';
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryOrder').value = categories.length + 1;
        document.getElementById('categoryActive').checked = true;
    }
    categoryModal.classList.add('active');
}

categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('categorySubmitBtn');
    const id = document.getElementById('categoryId').value;
    const name_ar = document.getElementById('categoryName').value.trim();
    const order = parseInt(document.getElementById('categoryOrder').value) || 1;
    const is_active = document.getElementById('categoryActive').checked;

    if (!name_ar) {
        showToast('يرجى إدخال اسم القسم', 'error');
        return;
    }

    setButtonLoading(submitBtn, true, id ? 'جاري الحفظ...' : 'جاري الإضافة...');

    const data = {
        name_ar,
        order,
        is_active,
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_by_id: currentAdmin ? currentAdmin.id : 'unknown',
        updated_by_name: currentAdmin ? (currentAdmin.displayName || currentAdmin.username) : 'غير معروف'
    };

    try {
        if (id) {
            const oldCat = categories.find(c => c.id === id);
            await db.collection('categories').doc(id).update(data);

            if (oldCat && oldCat.name_ar !== name_ar) {
                const linkedProds = await db.collection('products').where('category_id', '==', id).get();
                if (!linkedProds.empty) {
                    const batch = db.batch();
                    linkedProds.docs.forEach(doc => {
                        batch.update(doc.ref, { category_name: name_ar });
                    });
                    await batch.commit();
                }
            }

            showToast(`تم تعديل القسم "${name_ar}" وتحديث أصنافه المرتبطة بنجاح`, 'success');
        } else {
            data.created_at = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('categories').add(data);
            showToast(`تمت إضافة القسم "${name_ar}" بنجاح`, 'success');
        }
        await touchSystemMetadata();
        await fetchFreshDataFromFirebase();
        categoryModal.classList.remove('active');
    } catch (err) {
        console.error('Error saving category:', err);
        showToast('حدث خطأ أثناء حفظ القسم: ' + err.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (cat) openCategoryModal(cat);
};

window.deleteCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    const catName = cat ? cat.name_ar : '';

    const linkedCount = products.filter(p => p.category_id === id).length;
    if (linkedCount > 0) {
        showToast(`لا يمكن حذف القسم "${catName}" لأنه يحتوي على ${linkedCount} منتج مرتبط به! قم بنقل أو حذف المنتجات أولاً.`, 'error');
        return;
    }

    showConfirmDialog(
        'تأكيد حذف القسم',
        `هل أنت تأكد من حذف القسم الفارغ "${catName}"؟`,
        async () => {
            try {
                await db.collection('categories').doc(id).delete();
                await touchSystemMetadata();
                await fetchFreshDataFromFirebase();
                showToast(`تم حذف القسم "${catName}" بنجاح`, 'success');
            } catch (err) {
                console.error('Error deleting category:', err);
                showToast('حدث خطأ أثناء حذف القسم: ' + err.message, 'error');
            }
        }
    );
};

// ==========================================
// 7. Product CRUD Operations (With Audit Tracking)
// ==========================================
function openProductModal(prod = null) {
    productForm.reset();
    addonsContainer.innerHTML = '';
    const submitBtn = document.getElementById('productSubmitBtn');
    setButtonLoading(submitBtn, false);

    if (prod) {
        document.getElementById('productModalTitle').textContent = 'تعديل منتج';
        document.getElementById('productId').value = prod.id;
        document.getElementById('productCategory').value = prod.category_id;
        document.getElementById('productName').value = prod.name_ar;
        document.getElementById('productOrder').value = prod.order || 1;
        document.getElementById('productAvailable').checked = prod.is_available !== false;

        pricingType.value = prod.pricing_type || 'variant';
        pricingType.dispatchEvent(new Event('change'));

        if (prod.pricing_type === 'single') {
            document.getElementById('basePrice').value = prod.base_price || 0;
        } else {
            const smallObj = (prod.variants || []).find(v => v.size_name === 'صغير');
            const largeObj = (prod.variants || []).find(v => v.size_name === 'كبير');
            document.getElementById('smallPrice').value = smallObj ? smallObj.price : '';
            document.getElementById('largePrice').value = largeObj ? largeObj.price : '';
        }

        if (prod.addons && prod.addons.length > 0) {
            prod.addons.forEach(a => addAddonRow(a.name, a.price));
        }
    } else {
        document.getElementById('productModalTitle').textContent = 'إضافة منتج جديد';
        document.getElementById('productId').value = '';
        if (categoryFilter.value !== 'all') {
            document.getElementById('productCategory').value = categoryFilter.value;
        }
        document.getElementById('productOrder').value = products.length + 1;
        pricingType.value = 'variant';
        pricingType.dispatchEvent(new Event('change'));
        document.getElementById('productAvailable').checked = true;
    }
    productModal.classList.add('active');
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('productSubmitBtn');
    const id = document.getElementById('productId').value;
    const category_id = document.getElementById('productCategory').value;
    const name_ar = document.getElementById('productName').value.trim();
    const order = parseInt(document.getElementById('productOrder').value) || 1;
    const pType = pricingType.value;
    const is_available = document.getElementById('productAvailable').checked;

    if (!category_id) {
        showToast('يرجى اختيار القسم التابع له المنتج.', 'error');
        return;
    }

    if (!name_ar) {
        showToast('يرجى إدخال اسم المنتج.', 'error');
        return;
    }

    const linkedCat = categories.find(c => c.id === category_id);
    const category_name = linkedCat ? linkedCat.name_ar : '';

    setButtonLoading(submitBtn, true, id ? 'جاري الحفظ...' : 'جاري الإضافة...');

    const data = {
        category_id,
        category_name,
        name_ar,
        order,
        pricing_type: pType,
        is_available,
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_by_id: currentAdmin ? currentAdmin.id : 'unknown',
        updated_by_name: currentAdmin ? (currentAdmin.displayName || currentAdmin.username) : 'غير معروف'
    };

    if (pType === 'single') {
        data.base_price = parseFloat(document.getElementById('basePrice').value) || 0;
        data.variants = [];
    } else {
        const smallP = parseFloat(document.getElementById('smallPrice').value) || 0;
        const largeP = parseFloat(document.getElementById('largePrice').value) || 0;
        data.variants = [];
        if (smallP > 0) data.variants.push({ size_name: 'صغير', price: smallP });
        if (largeP > 0) data.variants.push({ size_name: 'كبير', price: largeP });
    }

    // Collect Addons
    const addons = [];
    document.querySelectorAll('.addon-row').forEach(row => {
        const aName = row.querySelector('.addon-name').value.trim();
        const aPrice = parseFloat(row.querySelector('.addon-price').value) || 0;
        if (aName) {
            addons.push({ name: aName, price: aPrice });
        }
    });
    data.addons = addons;

    try {
        if (id) {
            await db.collection('products').doc(id).update(data);
            showToast(`تم تعديل المنتج "${name_ar}" بنجاح`, 'success');
        } else {
            data.created_at = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(data);
            showToast(`تمت إضافة المنتج "${name_ar}" بنجاح`, 'success');
        }
        await touchSystemMetadata();
        await fetchFreshDataFromFirebase();
        productModal.classList.remove('active');
    } catch (err) {
        console.error('Error saving product:', err);
        showToast('حدث خطأ أثناء حفظ المنتج: ' + err.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

window.editProduct = function(id) {
    const prod = products.find(p => p.id === id);
    if (prod) openProductModal(prod);
};

window.deleteProduct = function(id) {
    const prod = products.find(p => p.id === id);
    const prodName = prod ? prod.name_ar : '';
    showConfirmDialog(
        'تأكيد حذف المنتج',
        `هل أنت تأكد من حذف المنتج "${prodName}" من المنيو؟`,
        async () => {
            try {
                await db.collection('products').doc(id).delete();
                await touchSystemMetadata();
                await fetchFreshDataFromFirebase();
                showToast(`تم حذف المنتج "${prodName}" بنجاح`, 'success');
            } catch (err) {
                console.error('Error deleting product:', err);
                showToast('حدث خطأ أثناء حذف المنتج: ' + err.message, 'error');
            }
        }
    );
};

// ==========================================
// 8. Admins CRUD Operations (Superadmin Only)
// ==========================================
if (addAdminBtn) {
    addAdminBtn.addEventListener('click', () => {
        openAdminModal();
    });
}

function openAdminModal(adminObj = null) {
    adminForm.reset();
    const submitBtn = document.getElementById('adminSubmitBtn');
    setButtonLoading(submitBtn, false);

    if (adminObj) {
        document.getElementById('adminModalTitle').textContent = 'تعديل بيانات المدير';
        document.getElementById('adminId').value = adminObj.id;
        document.getElementById('adminDisplayName').value = adminObj.displayName || '';
        document.getElementById('adminUsername').value = adminObj.username || '';
        document.getElementById('adminPassword').value = adminObj.password || '';
        document.getElementById('adminRole').value = adminObj.role || 'admin';
    } else {
        document.getElementById('adminModalTitle').textContent = 'إضافة مدير جديد';
        document.getElementById('adminId').value = '';
        document.getElementById('adminRole').value = 'admin';
    }
    adminModal.classList.add('active');
}

if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('adminSubmitBtn');
        const id = document.getElementById('adminId').value;
        const displayName = document.getElementById('adminDisplayName').value.trim();
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        const role = document.getElementById('adminRole').value;

        if (!displayName || !username || !password) {
            showToast('جميع الحقول مطلوبة!', 'error');
            return;
        }

        setButtonLoading(submitBtn, true, id ? 'جاري الحفظ...' : 'جاري الإضافة...');

        const data = {
            displayName,
            username,
            password, // Unencrypted password as per explicit prompt requirement
            role,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) {
                await db.collection('admins').doc(id).update(data);
                showToast(`تم تعديل بيانات المدير "${displayName}" بنجاح`, 'success');
            } else {
                data.created_at = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('admins').add(data);
                showToast(`تمت إضافة المدير "${displayName}" بنجاح`, 'success');
            }
            adminModal.classList.remove('active');
        } catch (err) {
            console.error('Error saving admin:', err);
            showToast('حدث خطأ أثناء حفظ بيانات المدير: ' + err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

window.editAdmin = function(id) {
    const adminObj = adminsList.find(a => a.id === id);
    if (adminObj) openAdminModal(adminObj);
};

window.deleteAdmin = function(id) {
    const adminObj = adminsList.find(a => a.id === id);
    const adminName = adminObj ? (adminObj.displayName || adminObj.username) : '';

    if (adminObj && adminObj.id === currentAdmin.id) {
        showToast('لا يمكنك حذف الحساب الخاص بك وأنت مسجل الدخول به!', 'error');
        return;
    }

    showConfirmDialog(
        'تأكيد حذف المدير',
        `هل أنت تأكد من حذف حساب المدير "${adminName}"؟ لن يتمكن من تسجيل الدخول بعدها.`,
        async () => {
            try {
                await db.collection('admins').doc(id).delete();
                showToast(`تم حذف المدير "${adminName}" بنجاح`, 'success');
            } catch (err) {
                console.error('Error deleting admin:', err);
                showToast('حدث خطأ أثناء حذف المدير: ' + err.message, 'error');
            }
        }
    );
};

// ==========================================
// 9. Bulk Seed & Clear Mazaz Database
// ==========================================
const seedDatabaseBtn = document.getElementById('seedDatabaseBtn');
const clearDatabaseBtn = document.getElementById('clearDatabaseBtn');
const seedProgress = document.getElementById('seedProgress');

if (clearDatabaseBtn) {
    clearDatabaseBtn.addEventListener('click', () => {
        showConfirmDialog(
            '⚠️ هل تريد حذف المنيو بالكامل؟',
            'سيؤدي هذا الإجراء إلى حذف جميع الأقسام والمنتجات الموجودة في قاعدة بيانات Firebase نهائياً! هل أنت متاكد؟',
            async () => {
                clearDatabaseBtn.disabled = true;
                seedProgress.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تفريغ قاعدة البيانات بمسح جميع المنتجات والأقسام...';

                try {
                    const prodSnapshot = await db.collection('products').get();
                    const prodBatch = db.batch();
                    prodSnapshot.docs.forEach(doc => prodBatch.delete(doc.ref));
                    await prodBatch.commit();

                    const catSnapshot = await db.collection('categories').get();
                    const catBatch = db.batch();
                    catSnapshot.docs.forEach(doc => catBatch.delete(doc.ref));
                    await catBatch.commit();

                    seedProgress.textContent = '🗑️ تم مسح جميع بيانات المنيو بنجاح من قاعدة البيانات!';
                    showToast('تم حذف المنيو بالكامل بنجاح', 'success');
                } catch (err) {
                    console.error('Clear DB Error:', err);
                    seedProgress.textContent = `❌ حدث خطأ أثناء الحذف: ${err.message}`;
                    showToast('حدث خطأ أثناء الحذف: ' + err.message, 'error');
                } finally {
                    clearDatabaseBtn.disabled = false;
                }
            }
        );
    });
}

if (seedDatabaseBtn) {
    seedDatabaseBtn.addEventListener('click', async () => {
        seedDatabaseBtn.disabled = true;
        seedProgress.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إدراج جميع أقسام ومنتجات مزاز بنجاح...';

        try {
            let totalCats = 0;
            let totalProds = 0;

            for (const catData of MAZAZ_INITIAL_DATA) {
                const catQuery = await db.collection('categories').where('name_ar', '==', catData.category_name).get();
                let catRef;
                let catName = catData.category_name;

                if (!catQuery.empty) {
                    catRef = catQuery.docs[0].ref;
                } else {
                    catRef = await db.collection('categories').add({
                        name_ar: catName,
                        order: catData.order,
                        is_active: true,
                        created_at: firebase.firestore.FieldValue.serverTimestamp(),
                        updated_by_id: currentAdmin ? currentAdmin.id : 'system',
                        updated_by_name: currentAdmin ? (currentAdmin.displayName || currentAdmin.username) : 'النظام (أولي)'
                    });
                    totalCats++;
                }

                for (const prodData of catData.products) {
                    const prodObj = {
                        category_id: catRef.id,
                        category_name: catName,
                        name_ar: prodData.name,
                        pricing_type: prodData.type,
                        order: prodData.order,
                        is_available: true,
                        created_at: firebase.firestore.FieldValue.serverTimestamp(),
                        updated_by_id: currentAdmin ? currentAdmin.id : 'system',
                        updated_by_name: currentAdmin ? (currentAdmin.displayName || currentAdmin.username) : 'النظام (أولي)'
                    };

                    if (prodData.type === 'single') {
                        prodObj.base_price = prodData.base_price || 0;
                        prodObj.variants = [];
                    } else {
                        prodObj.variants = [
                            { size_name: 'صغير', price: prodData.small },
                            { size_name: 'كبير', price: prodData.large }
                        ];
                    }

                    if (prodData.addons) {
                        prodObj.addons = prodData.addons;
                    } else {
                        prodObj.addons = [];
                    }

                    await db.collection('products').add(prodObj);
                    totalProds++;
                    seedProgress.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ الأقسام والمنتجات: تم رفع ${totalProds} منتج...`;
                }
            }

            seedProgress.textContent = `✅ تم الحفظ بنجاح! تم إضافة ${totalCats} قسم و ${totalProds} منتج إلى Firebase!`;
            showToast(`تم رفع المنيو الكامل بنجاح! (${totalCats} قسم و ${totalProds} منتج)`, 'success');
        } catch (err) {
            console.error('Seed Error:', err);
            seedProgress.textContent = `❌ حدث خطأ أثناء الرفع: ${err.message}`;
            showToast('حدث خطأ أثناء الرفع: ' + err.message, 'error');
        } finally {
            seedDatabaseBtn.disabled = false;
        }
    });
}


// ==========================================
// 2. Initial Seed Data (All Mazaz Items)
// ==========================================
const MAZAZ_INITIAL_DATA = [
    {
        category_name: "قسم الحلا",
        order: 1,
        products: [
            { name: "بان كيك", type: "single", base_price: 1500, order: 1 }
        ]
    },
    {
        category_name: "قسم البروتين",
        order: 2,
        products: [
            { name: "شوفان بالموز", type: "variant", small: 1200, large: 2200, order: 1 },
            { name: "شوفان بالتمر", type: "variant", small: 1200, large: 2200, order: 2 },
            { name: "شوفان بالتمر والموز والمكسرات والزبيب", type: "single", base_price: 2000, order: 3 },
            { name: "شوفان بالموز والمكسرات", type: "variant", small: 1500, large: 2800, order: 4 },
            { name: "شوفان بالتمر والمكسرات", type: "variant", small: 1500, large: 2800, order: 5 }
        ]
    },
    {
        category_name: "قسم المشروبات الساخنة",
        order: 3,
        products: [
            { name: "هوت شوكليت", type: "single", base_price: 1100, order: 1 },
            { name: "موكا حار", type: "single", base_price: 1100, order: 2 },
            { name: "كابتشينو", type: "single", base_price: 900, order: 3 },
            { name: "شاهي أحمر", type: "single", base_price: 200, order: 4 },
            { name: "شاهي أحمر بالنعناع", type: "single", base_price: 300, order: 5 },
            { name: "شاهي عدني", type: "single", base_price: 500, order: 6 },
            { name: "شاهي أخضر", type: "single", base_price: 200, order: 7 },
            { name: "شاهي أخضر بالنعناع", type: "single", base_price: 300, order: 8 },
            { name: "نعناع سادة", type: "single", base_price: 300, order: 9 }
        ]
    },
    {
        category_name: "قسم الأندومي",
        order: 4,
        products: [
            { name: "اندومي سادة دبل", type: "single", base_price: 800, order: 1 },
            { name: "اندومي حبة ونصف", type: "single", base_price: 1200, order: 2 },
            { name: "اندومي حبتين", type: "single", base_price: 1600, order: 3 }
        ]
    },
    {
        category_name: "قسم المشروبات الباردة",
        order: 5,
        products: [
            { name: "ماء", type: "single", base_price: 300, order: 1 },
            { name: "بيبسي", type: "single", base_price: 700, order: 2 },
            { name: "موهيتو صغير", type: "single", base_price: 800, order: 3 },
            { name: "موهيتو كبير", type: "single", base_price: 2000, order: 4 },
            { name: "سلاش", type: "single", base_price: 1200, order: 5 },
            { name: "كأس ثلج", type: "single", base_price: 200, order: 6 }
        ]
    },
    {
        category_name: "قسم الوجبات السريعة",
        order: 6,
        products: [
            { name: "ساندوتش بيض مقلي مع جبن", type: "single", base_price: 600, order: 1 },
            { name: "برجر", type: "single", base_price: 1600, order: 2 },
            { name: "ساندوتش نقانق", type: "single", base_price: 1100, order: 3 },
            { name: "ساندوتش بطاطس", type: "single", base_price: 600, order: 4 },
            { name: "ساندوتش جبن ومربى", type: "single", base_price: 500, order: 5 },
            { name: "ساندوتش نقانق بيض وجبن", type: "single", base_price: 1500, order: 6 },
            { name: "ساندوتش بيض مقلي مع جبن وشبس", type: "single", base_price: 1000, order: 7 },
            { name: "تشكن فرايز", type: "single", base_price: 3000, order: 8 },
            { name: "زنجر", type: "single", base_price: 1800, order: 9 },
            { name: "ساندوتش مربى وجبن كرافت", type: "single", base_price: 700, order: 10 },
            { name: "ساندوتش بيض دبل", type: "single", base_price: 900, order: 11 },
            { name: "ساندوتش بيض سادة", type: "single", base_price: 600, order: 12 },
            { name: "كرسبي", type: "single", base_price: 3500, order: 13 },
            { name: "برجر دبل", type: "single", base_price: 2000, order: 14 },
            { name: "فلافل", type: "single", base_price: 800, order: 15 },
            { name: "فلافل بالجبن", type: "single", base_price: 1000, order: 16 },
            { name: "ساندوتش بطاطس بالجبن", type: "single", base_price: 900, order: 17 },
            { name: "برجر بالجبن", type: "single", base_price: 2000, order: 18 },
            { name: "بطاطس", type: "single", base_price: 1000, order: 19 },
            { name: "ساندوتش شكشوكة", type: "single", base_price: 700, order: 20 },
            { name: "ساندوتش تونة", type: "single", base_price: 600, order: 21 },
            { name: "ساندوتش فول", type: "single", base_price: 600, order: 22 },
            { name: "كودو", type: "single", base_price: 1200, order: 23 },
            { name: "فاهيتا", type: "single", base_price: 1200, order: 24 },
            { 
                name: "إضافات الوجبات السريعة", 
                type: "single", 
                base_price: 0, 
                order: 25,
                addons: [
                    { name: "إضافة جبن", price: 500 },
                    { name: "إضافة خضار", price: 500 }
                ]
            }
        ]
    },
    {
        category_name: "عصائر متنوعة",
        order: 7,
        products: [
            { name: "عوار قلب", type: "variant", small: 600, large: 1200, order: 1 },
            { name: "اصفهاني", type: "variant", small: 1000, large: 1800, order: 2 },
            { name: "عوار قلب اصفهاني", type: "variant", small: 1000, large: 1700, order: 3 },
            { name: "طبقات", type: "variant", small: 900, large: 1600, order: 4 },
            { name: "عنب", type: "variant", small: 1200, large: 2200, order: 5 },
            { name: "رمان", type: "variant", small: 900, large: 1600, order: 6 },
            { name: "جزر", type: "variant", small: 700, large: 1400, order: 7 },
            { name: "مشكل فواكه", type: "variant", small: 1000, large: 1800, order: 8 },
            { name: "زنجبيل", type: "variant", small: 600, large: 1200, order: 9 },
            { name: "ليمون وزنجبيل", type: "variant", small: 800, large: 1400, order: 10 },
            { name: "ليمون ونعناع", type: "variant", small: 500, large: 1000, order: 11 },
            { name: "شمام حليب", type: "variant", small: 1000, large: 1800, order: 12 },
            { name: "عرائسي", type: "variant", small: 1500, large: 2800, order: 13 },
            { name: "عجوة باللبن", type: "variant", small: 1500, large: 2800, order: 14 },
            { name: "عجوة باللوز دبل", type: "variant", small: 1800, large: 3600, order: 15 },
            { name: "سموذي", type: "variant", small: 1400, large: 2600, order: 16 },
            { name: "توت أحمر", type: "variant", small: 1000, large: 1600, order: 17 },
            { name: "عصير وأنا صغير", type: "variant", small: 1000, large: 1400, order: 18 }
        ]
    },
    {
        category_name: "قسم النشاط و الحيوية",
        order: 8,
        products: [
            { name: "شمندر سادة", type: "variant", small: 700, large: 1200, order: 1 },
            { name: "افوكادو بالموز", type: "variant", small: 2200, large: 4200, order: 2 },
            { name: "افوكادو بالمانجو", type: "variant", small: 2300, large: 4200, order: 3 },
            { name: "افوكادو وفرولة", type: "variant", small: 2300, large: 4400, order: 4 },
            { name: "افوكادو بالحليب", type: "variant", small: 1900, large: 2600, order: 5 },
            { name: "افوكادو وموز ولوز وزبيب", type: "variant", small: 2700, large: 5200, order: 6 }
        ]
    },
    {
        category_name: "قسم الميلك شيك",
        order: 9,
        products: [
            { name: "ميلك شيك أوريو", type: "variant", small: 900, large: 1600, order: 1 },
            { name: "ميلك شيك فراولة", type: "variant", small: 1200, large: 2200, order: 2 },
            { name: "ميلك شيك شمام", type: "variant", small: 1200, large: 2200, order: 3 },
            { name: "ميلك شيك سنكرس", type: "variant", small: 1400, large: 2600, order: 4 },
            { name: "ميلك شيك حبحب", type: "variant", small: 1200, large: 2200, order: 5 },
            { name: "ميلك شيك سيريلاك", type: "variant", small: 1500, large: 2800, order: 6 },
            { name: "ايس موكا", type: "variant", small: 1100, large: 2000, order: 7 },
            { name: "ايس موكا بالأوريو", type: "variant", small: 1300, large: 2400, order: 8 },
            { name: "ايس شوكولاتة", type: "variant", small: 1100, large: 2000, order: 9 }
        ]
    },
    {
        category_name: "قسم الانتعاش",
        order: 10,
        products: [
            { name: "كركديه", type: "variant", small: 1500, large: 2000, order: 1 },
            { name: "كركديه بالنعناع", type: "variant", small: 1700, large: 2000, order: 2 },
            { name: "كركديه بالليمون والنعناع", type: "variant", small: 1900, large: 2200, order: 3 },
            { name: "كركديه بالأناناس", type: "variant", small: 1800, large: 2800, order: 4 }
        ]
    },
    {
        category_name: "قسم العصائر (الكيوي)",
        order: 11,
        products: [
            { name: "كيوي", type: "variant", small: 1300, large: 2400, order: 1 },
            { name: "كيوي ونعناع", type: "variant", small: 1400, large: 2600, order: 2 },
            { name: "كيوي ليمون ونعناع", type: "variant", small: 1500, large: 2800, order: 3 },
            { name: "كيوي وبرتقال", type: "variant", small: 1700, large: 3200, order: 4 },
            { name: "كيوي وفراولة", type: "variant", small: 1700, large: 3200, order: 5 },
            { name: "كيوي وبرتقال ونعناع", type: "variant", small: 1500, large: 2000, order: 6 },
            { name: "كيوي وشمندر", type: "variant", small: 1600, large: 3000, order: 7 },
            { name: "كيوي وأناناس", type: "variant", small: 1700, large: 3000, order: 8 },
            { name: "كيوي بالحليب", type: "variant", small: 1600, large: 3000, order: 9 }
        ]
    },
    {
        category_name: "قسم العصائر (الأناناس)",
        order: 12,
        products: [
            { name: "أناناس", type: "variant", small: 1000, large: 1800, order: 1 },
            { name: "أناناس ونعناع", type: "variant", small: 1100, large: 2000, order: 2 },
            { name: "أناناس وبرتقال", type: "variant", small: 1300, large: 2000, order: 3 },
            { name: "أناناس وفراولة", type: "variant", small: 1300, large: 2400, order: 4 }
        ]
    },
    {
        category_name: "قسم العصائر (الفراولة)",
        order: 13,
        products: [
            { name: "فراولة", type: "variant", small: 800, large: 1400, order: 1 },
            { name: "فراولة بالحليب", type: "variant", small: 1100, large: 2000, order: 2 },
            { name: "فراولة وشمندر", type: "variant", small: 1500, large: 3000, order: 3 },
            { name: "فراولة بالموز", type: "variant", small: 1100, large: 2000, order: 4 }
        ]
    },
    {
        category_name: "قسم العصائر (البرتقال)",
        order: 14,
        products: [
            { name: "برتقال", type: "variant", small: 900, large: 1800, order: 1 },
            { name: "برتقال مركز", type: "variant", small: 1500, large: 2800, order: 2 },
            { name: "برتقال وشمندر", type: "variant", small: 1300, large: 2600, order: 3 },
            { name: "برتقال وجزر وشمندر", type: "variant", small: 1300, large: 2600, order: 4 },
            { name: "برتقال وليمون", type: "variant", small: 1000, large: 2000, order: 5 },
            { name: "برتقال ليمون نعناع", type: "variant", small: 1300, large: 2600, order: 6 },
            { name: "برتقال ومانجو", type: "variant", small: 1500, large: 3000, order: 7 },
            { name: "برتقال وأناناس", type: "variant", small: 1300, large: 2400, order: 8 },
            { name: "برتقال وجزر", type: "variant", small: 1100, large: 2200, order: 9 },
            { name: "يوسف افندي", type: "variant", small: 1000, large: 1800, order: 10 }
        ]
    },
    {
        category_name: "قسم العصائر (الموز)",
        order: 15,
        products: [
            { name: "تمر بالحليب", type: "variant", small: 1000, large: 1800, order: 1 },
            { name: "موز بالحليب", type: "variant", small: 700, large: 1400, order: 2 },
            { name: "موز بالفراولة", type: "variant", small: 1300, large: 2600, order: 3 },
            { name: "موز بالأوريو", type: "variant", small: 1300, large: 2600, order: 4 },
            { name: "موز وشمام", type: "variant", small: 1300, large: 2600, order: 5 },
            { name: "موز بالمكسرات", type: "variant", small: 1100, large: 2200, order: 6 },
            { name: "موز بالمكسرات بالتمر", type: "variant", small: 1600, large: 3200, order: 7 },
            { name: "موز بالتمر", type: "variant", small: 1000, large: 2000, order: 8 },
            { name: "موز وتمر ولوز وزبيب", type: "variant", small: 1600, large: 3200, order: 9 },
            { name: "موز بالشوكولاتة", type: "variant", small: 1100, large: 2200, order: 10 },
            { name: "موز بالزبيب", type: "variant", small: 1000, large: 2000, order: 11 }
        ]
    },
    {
        category_name: "قسم العصائر (الحبحب)",
        order: 16,
        products: [
            { name: "حبحب", type: "variant", small: 800, large: 1500, order: 1 },
            { name: "حبحب ونعناع", type: "variant", small: 900, large: 1600, order: 2 },
            { name: "حبحب ليمون ونعناع", type: "variant", small: 1000, large: 1800, order: 3 },
            { name: "حبحب وليمون", type: "variant", small: 1000, large: 1800, order: 4 },
            { name: "حبحب بالحليب", type: "variant", small: 1100, large: 2000, order: 5 },
            { name: "حبحب وفراولة", type: "variant", small: 1300, large: 1500, order: 6 },
            { name: "حبحب وشمندر", type: "variant", small: 1300, large: 1500, order: 7 },
            { name: "حبحب وشمام", type: "variant", small: 1100, large: 2000, order: 8 }
        ]
    },
    {
        category_name: "قسم العصائر (المنجا)",
        order: 17,
        products: [
            { name: "منجا", type: "variant", small: 900, large: 1800, order: 1 },
            { name: "منجا بالحليب (مشكل)", type: "variant", small: 1000, large: 2000, order: 2 },
            { name: "منجا وفراولة", type: "variant", small: 1400, large: 2600, order: 3 },
            { name: "منجا وشمندر", type: "variant", small: 1400, large: 2600, order: 4 },
            { name: "منجا وشمام", type: "variant", small: 1200, large: 2200, order: 5 }
        ]
    },
    {
        category_name: "قسم العصائر (الجوافة)",
        order: 18,
        products: [
            { name: "جوافة", type: "variant", small: 1000, large: 1800, order: 1 },
            { name: "جوافة ونعناع", type: "variant", small: 1100, large: 2000, order: 2 },
            { name: "جوافة وفراولة", type: "variant", small: 1500, large: 3000, order: 3 },
            { name: "جوافة بالمانجو", type: "variant", small: 1400, large: 2500, order: 4 },
            { name: "جوافة بالشمام", type: "variant", small: 1400, large: 2400, order: 5 }
        ]
    }
];





