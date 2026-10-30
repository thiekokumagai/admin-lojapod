const fs = require('fs');
const filePath = 'c:/sites/lojapod/admin-lojapod/src/pages/CashRegisterDetailsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex1 = /\{\s*\(order\.paymentMethod === 'pix' \|\| order\.paymentMethod === 'PIX'\)[\s\S]*?order\.paymentMethod \|\| "-"[\s\S]*?\}/;
code = code.replace(regex1, '{formatPaymentMethod(order.paymentMethod)}');

const regex2 = /\{\s*\(order\.paymentMethod === 'pix' \|\| order\.paymentMethod === 'PIX'\)[\s\S]*?order\.paymentMethod \|\| "-"[\s\S]*?\}/;
code = code.replace(regex2, '{formatPaymentMethod(order.paymentMethod)}');

const regex3 = /<span className="text-sm font-semibold text-blue-800">\{\s*\(method === 'pix' \|\| method === 'PIX'\)[\s\S]*?method\s*\}<\/span>/;
code = code.replace(regex3, '<span className="text-sm font-semibold text-blue-800">{formatPaymentMethod(method)}</span>');

const regex4 = /<span className="text-sm font-semibold text-slate-600">\{\s*\(method === 'pix' \|\| method === 'PIX'\)[\s\S]*?method\s*\}<\/span>/;
code = code.replace(regex4, '<span className="text-sm font-semibold text-slate-600">{formatPaymentMethod(method)}</span>');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Done replacing in CashRegisterDetailsPage!');
