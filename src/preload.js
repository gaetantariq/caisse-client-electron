const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('posAPI', {
    getProducts: () => ipcRenderer.invoke('db:get-products'),
    createProduct: (p) => ipcRenderer.invoke('db:create-product', p),
    scanEAN: (ean) => ipcRenderer.invoke('api:scan-off', ean),
    findProduct: (code) => ipcRenderer.invoke('db:find-product', code),
    commitSale: (cart) => ipcRenderer.invoke('db:commit-sale', cart),

    // Nouveautés Compta :
    getSales: () => ipcRenderer.invoke('db:get-sales'),
    exportCSV: () => ipcRenderer.invoke('fs:export-csv')
});