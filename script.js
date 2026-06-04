const API_URL = 'https://dummyjson.com/products';
let productsData = [];
let editMode = false;
let editId = null;

const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const productCategorySelect = document.getElementById('product-category');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const defaultClothes = [
    { id: 1, title: "CK Classic Kemeja Putih", price: 1850000, category: "Kemeja" },
    { id: 2, title: "CK Slim Fit Jeans", price: 2250000, category: "Celana" },
    { id: 3, title: "CK Hoodie Premium", price: 1950000, category: "Jaket" },
    { id: 4, title: "CK Polo Shirt", price: 1250000, category: "Kaos" },
    { id: 5, title: "CK Blazer Formal", price: 3750000, category: "Jaket" }
];

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka);
}

async function fetchProducts() {
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = '<div class="loading">🔄 Memuat data pakaian...</div>';
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const apiProducts = data.products.slice(0, 10).map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            category: p.category || 'Pakaian'
        }));
        
        const filteredClothes = apiProducts.filter(p => 
            p.title.toLowerCase().includes('shirt') || 
            p.title.toLowerCase().includes('jacket') ||
            p.title.toLowerCase().includes('jeans') ||
            p.title.toLowerCase().includes('dress') ||
            p.title.toLowerCase().includes('pant') ||
            p.title.toLowerCase().includes('blazer')
        );
        
        if (filteredClothes.length > 0) {
            productsData = filteredClothes.slice(0, 5);
        } else {
            productsData = [...defaultClothes];
        }
        
        renderProducts();
    } catch (error) {
        productsData = [...defaultClothes];
        renderProducts();
        showNotification('Menggunakan data lokal pakaian Calvin Klein', 'info');
    }
}

function renderProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (productsData.length === 0) {
        productsContainer.innerHTML = '<div class="loading">📦 Belum ada pakaian. Silakan tambah produk baru!</div>';
        return;
    }
    
    let productsHTML = '';
    for (let i = 0; i < productsData.length; i++) {
        const product = productsData[i];
        const category = product.category || productCategorySelect.options[0].text;
        let categoryIcon = '👕';
        if (category === 'Jaket') categoryIcon = '🧥';
        else if (category === 'Celana') categoryIcon = '👖';
        else if (category === 'Kaos') categoryIcon = '👚';
        else if (category === 'Dress') categoryIcon = '👗';
        else categoryIcon = '👕';
        
        productsHTML += `
            <div class="product-item" data-id="${product.id}">
                <div class="product-info">
                    <div class="product-name">${categoryIcon} ${product.title}</div>
                    <div class="product-category">📌 Kategori: ${category}</div>
                    <div class="product-price">💰 ${formatRupiah(product.price)}</div>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }
    productsContainer.innerHTML = productsHTML;
}

async function addProduct(productName, productPrice, productCategory) {
    try {
        const newProduct = {
            title: productName,
            price: parseInt(productPrice),
            category: productCategory
        };
        
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const productWithId = {
            id: data.id,
            title: data.title,
            price: data.price,
            category: productCategory
        };
        
        productsData.unshift(productWithId);
        renderProducts();
        resetForm();
        showNotification('✅ Pakaian berhasil ditambahkan!', 'success');
    } catch (error) {
        const productWithId = {
            id: Date.now(),
            title: productName,
            price: parseInt(productPrice),
            category: productCategory
        };
        productsData.unshift(productWithId);
        renderProducts();
        resetForm();
        showNotification('✅ Pakaian berhasil ditambahkan (lokal)!', 'success');
    }
}

async function updateProduct(id, newTitle, newPrice, newCategory) {
    try {
        const updatedProduct = {
            title: newTitle,
            price: parseInt(newPrice),
            category: newCategory
        };
        
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });
        
        const productIndex = productsData.findIndex(p => p.id === id);
        if (productIndex !== -1) {
            productsData[productIndex].title = newTitle;
            productsData[productIndex].price = parseInt(newPrice);
            productsData[productIndex].category = newCategory;
        }
        
        renderProducts();
        resetForm();
        showNotification('✏️ Pakaian berhasil diupdate!', 'success');
    } catch (error) {
        const productIndex = productsData.findIndex(p => p.id === id);
        if (productIndex !== -1) {
            productsData[productIndex].title = newTitle;
            productsData[productIndex].price = parseInt(newPrice);
            productsData[productIndex].category = newCategory;
        }
        renderProducts();
        resetForm();
        showNotification('✏️ Pakaian berhasil diupdate!', 'success');
    }
}

async function deleteProduct(id) {
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus pakaian ini?');
    if (!confirmDelete) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        productsData = productsData.filter(product => product.id !== id);
        renderProducts();
        showNotification('🗑️ Pakaian berhasil dihapus!', 'success');
        
        if (editMode && editId === id) {
            resetForm();
        }
    } catch (error) {
        productsData = productsData.filter(product => product.id !== id);
        renderProducts();
        showNotification('🗑️ Pakaian berhasil dihapus!', 'success');
        
        if (editMode && editId === id) {
            resetForm();
        }
    }
}

function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) {
        showNotification('❌ Pakaian tidak ditemukan!', 'error');
        return;
    }
    
    productNameInput.value = product.title;
    productPriceInput.value = product.price;
    if (product.category) {
        productCategorySelect.value = product.category;
    }
    editMode = true;
    editId = id;
    submitBtn.textContent = 'Simpan Perubahan';
    cancelBtn.style.display = 'inline-block';
    document.getElementById('form-title').textContent = 'Edit Pakaian';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    productNameInput.value = '';
    productPriceInput.value = '';
    productCategorySelect.value = 'Kemeja';
    editMode = false;
    editId = null;
    submitBtn.textContent = 'Tambah Pakaian';
    cancelBtn.style.display = 'none';
    document.getElementById('form-title').textContent = 'Tambah Pakaian Baru';
}

function showNotification(message, type) {
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        const container = document.querySelector('.container');
        container.insertBefore(notification, container.firstChild);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
    } else if (type === 'info') {
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.color = '#0c5460';
    } else {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
    }
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.marginBottom = '15px';
    notification.style.textAlign = 'center';
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

productForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const productName = productNameInput.value.trim();
    const productPrice = productPriceInput.value.trim();
    const productCategory = productCategorySelect.value;
    
    if (!productName || !productPrice) {
        showNotification('❌ Harap isi semua field!', 'error');
        return;
    }
    
    if (editMode) {
        await updateProduct(editId, productName, productPrice, productCategory);
    } else {
        await addProduct(productName, productPrice, productCategory);
    }
};

cancelBtn.addEventListener('click', () => {
    resetForm();
});

fetchProducts();