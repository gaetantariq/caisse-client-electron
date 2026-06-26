// src/services/openfoodfacts.js
async function fetchProductFromOFF(ean) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Sécurité hors-ligne

    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data.status === 1) {
      return { 
        success: true, 
        name: data.product.product_name || 'Produit inconnu', 
        brand: data.product.brands || '' 
      };
    }
    return { success: false, reason: 'NOT_FOUND' };
  } catch (error) {
    return { success: false, reason: 'TIMEOUT_OR_OFFLINE' };
  }
}

module.exports = { fetchProductFromOFF };