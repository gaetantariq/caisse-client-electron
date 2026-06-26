function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    document.getElementById(`nav-${t}`).classList.add('active');
    if(t === 'pos') document.getElementById('pos-scan').focus();
    if(t === 'sales') loadSales();
}

// --- CAISSE ---
let cart = [];
const scanIn = document.getElementById('pos-scan');
scanIn.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && scanIn.value.trim()) {
        const p = await window.posAPI.findProduct(scanIn.value.trim());
        if (p) { addToCart(p); scanIn.value = ''; } else { alert('Article inconnu'); scanIn.select(); }
    }
});

function addToCart(p) {
    const ex = cart.find(i => i.id === p.id);
    if (ex) ex.qty++; else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    renderCart();
}

function updateQty(id, d) {
    const i = cart.find(x => x.id === id);
    if (!i) return; i.qty += d; if (i.qty <= 0) cart = cart.filter(x => x.id !== id);
    renderCart();
}

function renderCart() {
    document.getElementById('cart-list').innerHTML = cart.map(i => `
        <tr><td><b>${i.name}</b></td><td>${(i.price/100).toFixed(2)}€</td>
        <td><button onclick="updateQty(${i.id},-1)">-</button> ${i.qty} <button onclick="updateQty(${i.id},1)">+</button></td>
        <td><b>${((i.price*i.qty)/100).toFixed(2)}€</b></td>
        <td><button onclick="updateQty(${i.id},-999)" style="color:red;border:none;background:none;cursor:pointer;">X</button></td></tr>`).join('');
    document.getElementById('cart-total').innerText = (cart.reduce((s,i)=>s+(i.price*i.qty),0)/100).toFixed(2);
}

document.getElementById('btn-pay').addEventListener('click', async () => {
    if (!cart.length) return;
    const res = await window.posAPI.commitSale(cart);
    if (res.success) { alert('✅ Vente enregistrée !'); cart = []; renderCart(); }
});

// --- CATALOGUE ---
async function loadCat() {
    const p = await window.posAPI.getProducts();
    document.getElementById('cat-list').innerHTML = p.map(i => `<tr><td><small>${i.sku}</small></td><td>${i.name}</td><td>${(i.price/100).toFixed(2)}€</td></tr>`).join('');
}
document.getElementById('btn-lookup').onclick = async () => {
    const e = document.getElementById('cat-ean').value.trim();
    if(!e) return; const r = await window.posAPI.scanEAN(e);
    if(r.success) { document.getElementById('cat-name').value = r.name; document.getElementById('cat-price').focus(); } else alert('Introuvable');
};
document.getElementById('btn-save-cat').onclick = async () => {
    const n = document.getElementById('cat-name').value.trim();
    const p = Math.round(parseFloat(document.getElementById('cat-price').value)*100);
    if(!n || isNaN(p)) return;
    await window.posAPI.createProduct({ ean: document.getElementById('cat-ean').value.trim(), sku: 'REF-'+Date.now().toString().slice(-4), name: n, price: p });
    document.querySelectorAll('#tab-cat input').forEach(i=>i.value=''); loadCat();
};

// --- COMPTA ---
async function loadSales() {
    const s = await window.posAPI.getSales();
    document.getElementById('sales-list').innerHTML = s.map(i => `
        <tr><td><b># ${i.id}</b></td><td>${new Date(i.created_at).toLocaleString('fr-FR')}</td><td><b>${(i.total/100).toFixed(2)} €</b></td></tr>`).join('');
}

document.getElementById('btn-export').addEventListener('click', async () => {
    const res = await window.posAPI.exportCSV();
    if(res.success) alert('📊 Fichier CSV généré avec succès ! Tu peux l\'envoyer au comptable.');
});

loadCat();