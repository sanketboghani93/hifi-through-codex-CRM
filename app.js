const $ = (selector) => document.querySelector(selector);
const productList = $('#productList');
const productTemplate = $('#productTemplate');
const defaultMessage = 'Hi {name}, it was lovely having you at Hifi Collection. Here is a little edit saved especially for you.';
let note = localStorage.getItem('hifi-note') || defaultMessage;
const fallbackConfig = { staff: ['Aanya', 'Rhea', 'Simran'], categories: ['Lehenga', 'Gown', 'Saree', 'Co-ord set', 'Dress', 'Jewellery', 'Accessory', 'Other'] };
let configuration = fallbackConfig;

function cleanList(items, fallback) {
  return Array.isArray(items) && items.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()).length
    ? [...new Set(items.map((item) => item.trim()).filter(Boolean))] : fallback;
}
function populateSelect(select, options, placeholder) {
  const selected = select.value;
  select.replaceChildren(new Option(placeholder, ''), ...options.map((item) => new Option(item, item)));
  select.value = options.includes(selected) ? selected : '';
  select.disabled = false;
}
function applyConfiguration(config) {
  configuration = { staff: cleanList(config.staff, fallbackConfig.staff), categories: cleanList(config.categories, fallbackConfig.categories) };
  populateSelect($('#staffName'), configuration.staff, 'Select staff member');
  document.querySelectorAll('.product-category').forEach((select) => populateSelect(select, configuration.categories, 'Select category'));
}
function configUrl(endpoint) { const url = new URL(endpoint); url.searchParams.set('action', 'config'); return url.toString(); }
async function loadConfiguration(endpoint = localStorage.getItem('hifi-sheet-endpoint')) {
  if (!endpoint) { applyConfiguration(fallbackConfig); return false; }
  try { const response = await fetch(configUrl(endpoint)); if (!response.ok) throw new Error('Unable to load configuration'); applyConfiguration(await response.json()); $('#syncStatus').innerHTML = '<i></i> Sheet connected'; return true; }
  catch { applyConfiguration(fallbackConfig); $('#syncStatus').innerHTML = '<i></i> Using backup lists'; return false; }
}

function addProduct() {
  const product = productTemplate.content.cloneNode(true);
  product.querySelector('.remove-product').addEventListener('click', (event) => {
    if (productList.children.length > 1) event.currentTarget.closest('.product-row').remove();
  });
  productList.append(product);
  populateSelect(productList.lastElementChild.querySelector('.product-category'), configuration.categories, 'Select category');
}
function updateNotePreview() { $('#messagePreview').textContent = note; }
function dateLabel(date = new Date()) { return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(); }

addProduct(); updateNotePreview(); $('#todayDate').textContent = dateLabel(); loadConfiguration();
$('#addProduct').addEventListener('click', addProduct);

$('#editMessage').addEventListener('click', () => { $('#messageInput').value = note; $('#messageDialog').showModal(); });
$('#saveMessage').addEventListener('click', () => { note = $('#messageInput').value.trim() || defaultMessage; localStorage.setItem('hifi-note', note); updateNotePreview(); });

$('#settingsButton').addEventListener('click', () => { $('#sheetEndpoint').value = localStorage.getItem('hifi-sheet-endpoint') || ''; $('#settingsDialog').showModal(); });
$('#saveSettings').addEventListener('click', () => { const value = $('#sheetEndpoint').value.trim(); if (value) { localStorage.setItem('hifi-sheet-endpoint', value); loadConfiguration(value); } });
$('#clearSettings').addEventListener('click', () => { localStorage.removeItem('hifi-sheet-endpoint'); applyConfiguration(fallbackConfig); $('#syncStatus').innerHTML = '<i></i> Using device storage'; });

function getVisit() {
  const products = [...document.querySelectorAll('.product-row')].map((row) => ({ category: row.querySelector('.product-category').value, id: row.querySelector('.product-id').value.trim() }));
  return { staffName: $('#staffName').value, name: $('#customerName').value.trim(), phone: $('#phone').value.trim(), email: $('#email').value.trim(), instagram: $('#instagram').value.trim(), eventDate: $('#eventDate').value, notes: $('#notes').value.trim(), products, message: note, loggedAt: new Date().toISOString() };
}
function displayVisit(visit) {
  $('#cardName').textContent = visit.name;
  $('#cardDate').textContent = dateLabel();
  $('#cardMessage').textContent = visit.message.replaceAll('{name}', visit.name);
  $('#cardProducts').replaceChildren(...visit.products.map((product) => { const row = document.createElement('div'); row.className = 'card-product'; const category = document.createElement('span'); category.textContent = product.category; const id = document.createElement('span'); id.textContent = product.id; row.append(category, id); return row; }));
  $('#formView').classList.add('hidden'); $('.progress').classList.add('hidden'); $('#cardView').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function logVisit(visit) {
  const visits = JSON.parse(localStorage.getItem('hifi-visits') || '[]'); visits.unshift(visit); localStorage.setItem('hifi-visits', JSON.stringify(visits));
  const endpoint = localStorage.getItem('hifi-sheet-endpoint');
  if (!endpoint) return 'Saved to this device';
  try { await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(visit) }); return 'Saved to Google Sheets'; } catch { return 'Saved to this device — sheet sync pending'; }
}
$('#visitForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const visit = getVisit();
  if (visit.products.some((item) => !item.category || !item.id)) { alert('Please add a category and product ID for every piece.'); return; }
  displayVisit(visit); $('#loggedText').textContent = 'Logging visit…'; $('#loggedText').textContent = await logVisit(visit);
  $('#whatsappButton').onclick = () => { const pieces = visit.products.map((p) => `• ${p.category}: ${p.id}`).join('\n'); const eventLine = visit.eventDate ? `\nEvent date: ${new Date(`${visit.eventDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''; const message = `${visit.message.replaceAll('{name}', visit.name)}\n\nYour saved Hifi edit:\n${pieces}${eventLine}${visit.notes ? `\n\nStylist note: ${visit.notes}` : ''}\n\n— Hifi Collection`; window.open(`https://wa.me/${visit.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener'); };
  $('#copyButton').onclick = async () => { const details = `${visit.staffName} logged ${visit.name} | ${visit.phone}\n${visit.products.map((p) => `${p.category}: ${p.id}`).join('\n')}`; await navigator.clipboard.writeText(details); $('#copyButton').textContent = 'Copied!'; setTimeout(() => $('#copyButton').textContent = 'Copy details', 1800); };
});
$('#newVisit').addEventListener('click', () => { $('#visitForm').reset(); productList.innerHTML = ''; addProduct(); $('#cardView').classList.add('hidden'); $('#formView').classList.remove('hidden'); $('.progress').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
