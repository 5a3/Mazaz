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

// Update connection status UI
const firebaseStatus = document.getElementById('firebaseStatus');
db.enablePersistence().catch(() => {}).finally(() => {
    if (firebaseStatus) {
        firebaseStatus.classList.add('connected');
        firebaseStatus.querySelector('.status-text').textContent = 'متصل بـ Firebase (mazaz-de904)';
    }
});

// Global Application State
let categories = [];
let products = [];
let activeTab = 'categories-tab';

// DOM Elements
const categoriesTableBody = document.getElementById('categoriesTableBody');
const productsTableBody = document.getElementById('productsTableBody');
const categoryFilter = document.getElementById('categoryFilter');
const productCategorySelect = document.getElementById('productCategory');
const categoryModal = document.getElementById('categoryModal');
const productModal = document.getElementById('productModal');
const categoryForm = document.getElementById('categoryForm');
const productForm = document.getElementById('productForm');
const headerAddBtn = document.getElementById('headerAddBtn');
const pricingType = document.getElementById('pricingType');
const singlePriceSection = document.getElementById('singlePriceSection');
const variantPriceSection = document.getElementById('variantPriceSection');
const addonsContainer = document.getElementById('addonsContainer');
const addAddonBtn = document.getElementById('addAddonBtn');

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

// ==========================================
// 3. Navigation & Tab Switching
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        const targetTab = btn.getAttribute('data-tab');
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        activeTab = targetTab;

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
// 4. Firestore Realtime Listeners
// ==========================================
function listenToCategories() {
    db.collection('categories').orderBy('order', 'asc').onSnapshot(snapshot => {
        categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        renderCategoriesTable();
        populateCategoryDropdowns();
        renderProductsTable(); // Re-render products to update category names
    }, err => {
        console.error("Error fetching categories:", err);
    });
}

function listenToProducts() {
    db.collection('products').orderBy('order', 'asc').onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProductsTable();
    }, err => {
        console.error("Error fetching products:", err);
    });
}

// Initialize Realtime Data
listenToCategories();
listenToProducts();

// ==========================================
// 5. Render Tables & Views
// ==========================================
function renderCategoriesTable() {
    document.getElementById('categoriesCount').textContent = `${categories.length} قسم`;
    if (categories.length === 0) {
        categoriesTableBody.innerHTML = `<tr><td colspan="5" class="text-center loading-cell">لا يوجد أقسام حالياً. يمكنك استخدام زر "إدخال البيانات الأولية" لرفع المنيو.</td></tr>`;
        return;
    }

    let html = '';
    categories.forEach(cat => {
        const prodCount = products.filter(p => p.category_id === cat.id).length;
        const statusBadge = cat.is_active !== false ?
            `<span class="badge" style="background:#E8F8F0; color:#2ECC71;">نشط</span>` :
            `<span class="badge" style="background:#FEE2E2; color:#EF4444;">مخفي</span>`;

        html += `
            <tr>
                <td><strong>#${cat.order || 1}</strong></td>
                <td><strong>${cat.name_ar}</strong></td>
                <td>${prodCount} منتج</td>
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
    // Filter dropdown
    let filterHtml = '<option value="all">جميع الأقسام</option>';
    // Modal dropdown
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
        productsTableBody.innerHTML = `<tr><td colspan="7" class="text-center loading-cell">لا يوجد منتجات في هذا القسم.</td></tr>`;
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

        html += `
            <tr>
                <td><strong>#${prod.order || 1}</strong></td>
                <td><strong>${prod.name_ar}</strong></td>
                <td>${catName}</td>
                <td>${pricingDisplay}</td>
                <td>${addonsDisplay}</td>
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

// ==========================================
// 6. Category CRUD Operations
// ==========================================
function openCategoryModal(cat = null) {
    categoryForm.reset();
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
    const id = document.getElementById('categoryId').value;
    const name_ar = document.getElementById('categoryName').value.trim();
    const order = parseInt(document.getElementById('categoryOrder').value) || 1;
    const is_active = document.getElementById('categoryActive').checked;

    const data = { name_ar, order, is_active, updated_at: firebase.firestore.FieldValue.serverTimestamp() };

    try {
        if (id) {
            await db.collection('categories').doc(id).update(data);
        } else {
            data.created_at = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('categories').add(data);
        }
        categoryModal.classList.remove('active');
    } catch (err) {
        alert('حدث خطأ أثناء حفظ القسم: ' + err.message);
    }
});

window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (cat) openCategoryModal(cat);
};

window.deleteCategory = async function(id) {
    if (confirm('هل أنت تأكد من حذف هذا القسم؟ سيؤدي ذلك أيضاً لمنع ظهور منتجاته.')) {
        try {
            await db.collection('categories').doc(id).delete();
        } catch (err) {
            alert('حدث خطأ أثناء الحذف: ' + err.message);
        }
    }
};

// ==========================================
// 7. Product CRUD Operations
// ==========================================
function openProductModal(prod = null) {
    productForm.reset();
    addonsContainer.innerHTML = '';

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
    const id = document.getElementById('productId').value;
    const category_id = document.getElementById('productCategory').value;
    const name_ar = document.getElementById('productName').value.trim();
    const order = parseInt(document.getElementById('productOrder').value) || 1;
    const pType = pricingType.value;
    const is_available = document.getElementById('productAvailable').checked;

    if (!category_id) {
        alert('يرجى اختيار القسم التابع له المنتج.');
        return;
    }

    const data = {
        category_id,
        name_ar,
        order,
        pricing_type: pType,
        is_available,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
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
        } else {
            data.created_at = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(data);
        }
        productModal.classList.remove('active');
    } catch (err) {
        alert('حدث خطأ أثناء حفظ المنتج: ' + err.message);
    }
});

window.editProduct = function(id) {
    const prod = products.find(p => p.id === id);
    if (prod) openProductModal(prod);
};

window.deleteProduct = async function(id) {
    if (confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
        try {
            await db.collection('products').doc(id).delete();
        } catch (err) {
            alert('حدث خطأ أثناء حذف المنتج: ' + err.message);
        }
    }
};

// ==========================================
// 8. Bulk Seed Mazaz Database
// ==========================================
const seedDatabaseBtn = document.getElementById('seedDatabaseBtn');
const seedProgress = document.getElementById('seedProgress');

if (seedDatabaseBtn) {
    seedDatabaseBtn.addEventListener('click', async () => {
        if (!confirm('هل تريد رفع إدخال منيو مزاز كاملاً إلى Firestore؟ قد يستغرق ذلك بضع ثوانٍ.')) return;

        seedDatabaseBtn.disabled = true;
        seedProgress.textContent = 'جاري البدء بحفظ الأقسام والمنتجات...';

        try {
            let totalCats = 0;
            let totalProds = 0;

            for (const catData of MAZAZ_INITIAL_DATA) {
                // Check if category already exists by name
                const catQuery = await db.collection('categories').where('name_ar', '==', catData.category_name).get();
                let catRef;
                if (!catQuery.empty) {
                    catRef = catQuery.docs[0].ref;
                } else {
                    catRef = await db.collection('categories').add({
                        name_ar: catData.category_name,
                        order: catData.order,
                        is_active: true,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    totalCats++;
                }

                // Add products under this category
                for (const prodData of catData.products) {
                    const prodObj = {
                        category_id: catRef.id,
                        name_ar: prodData.name,
                        pricing_type: prodData.type,
                        order: prodData.order,
                        is_available: true,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
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
                    seedProgress.textContent = `تم إضافة ${totalProds} منتج حتى الآن...`;
                }
            }

            seedProgress.textContent = `✅ تم الحفظ بنجاح! تم إضافة ${totalCats} قسم و ${totalProds} منتج إلى Firebase!`;
            alert(`تم رفع المنيو الكامل بنجاح! (${totalCats} قسم و ${totalProds} منتج)`);
        } catch (err) {
            console.error('Seed Error:', err);
            seedProgress.textContent = `❌ حدث خطأ أثناء الرفع: ${err.message}`;
        } finally {
            seedDatabaseBtn.disabled = false;
        }
    });
}
