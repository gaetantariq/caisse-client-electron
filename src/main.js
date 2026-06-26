const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database'); 
const { fetchProductFromOFF } = require('./services/openfoodfacts');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200, height: 850,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile(path.join(__dirname, 'renderer/index.html'));
}

ipcMain.handle('db:get-products', () => db.prepare('SELECT * FROM products ORDER BY id DESC').all());
ipcMain.handle('db:create-product', (e, p) => {
  const stmt = db.prepare('INSERT INTO products (ean, sku, name, price) VALUES (?, ?, ?, ?)');
  try { return { success: true, id: stmt.run(p.ean || null, p.sku, p.name, p.price).lastInsertRowid }; }
  catch (err) { return { success: false, error: err.message }; }
});
ipcMain.handle('api:scan-off', async (e, ean) => await fetchProductFromOFF(ean));
ipcMain.handle('db:find-product', (e, code) => db.prepare('SELECT * FROM products WHERE ean = ? OR sku = ?').get(code, code));

ipcMain.handle('db:commit-sale', (e, cart) => {
  const insertSale = db.prepare('INSERT INTO sales (total) VALUES (?)');
  const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)');
  const tx = db.transaction((items) => {
    const totalCents = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const saleId = insertSale.run(totalCents).lastInsertRowid;
    for (const item of items) insertItem.run(saleId, item.id, item.qty, item.price);
    return saleId;
  });
  try { return { success: true, saleId: tx(cart) }; } catch (err) { return { success: false, error: err.message }; }
});

// --- COMPTA ---
ipcMain.handle('db:get-sales', () => db.prepare('SELECT * FROM sales ORDER BY id DESC').all());

ipcMain.handle('fs:export-csv', async () => {
  const sales = db.prepare('SELECT * FROM sales ORDER BY id ASC').all();
  let csv = "ID_Ticket;Date_Heure;Total_TTC_Euros\n";
  
  sales.forEach(s => {
    const date = new Date(s.created_at).toLocaleString('fr-FR');
    csv += `${s.id};"${date}";${(s.total / 100).toFixed(2).replace('.', ',')}\n`;
  });

  const { filePath } = await dialog.showSaveDialog({
    title: 'Générer l\'export comptable',
    defaultPath: `export_compta_${Date.now()}.csv`,
    filters: [{ name: 'Fichier Excel/CSV', extensions: ['csv'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, "\uFEFF" + csv, 'utf8'); // \uFEFF force Excel à lire les accents français
    return { success: true };
  }
  return { success: false };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });