const test = require('node:test');
const assert = require('node:assert');

test('Zéro faille comptable : Addition exacte des centimes', () => {
  const panier = [
    { price: 120, qty: 2 }, // 1.20€ x2 = 240
    { price: 85, qty: 1 }   // 0.85€ x1 = 85
  ];
  
  const totalCentimes = panier.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // 240 + 85 doit faire 325 centimes (3.25 €), pas 325.0000004
  assert.strictEqual(totalCentimes, 325);
});