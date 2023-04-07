/*
document.getElementById('grocery-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const items = Array.from(formData.getAll('items'));
  const response = await fetch('/generate-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await response.json();
  const sortedItems = data.sortedItems;
  const listContainer = document.getElementById('grocery-list');
  listContainer.innerHTML = `<h2>${new Date().toLocaleDateString()} Groceries list</h2>`;
  const list = document.createElement('ul');
  sortedItems.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `- [ ] ${item}`;
    list.appendChild(listItem);
  });
  listContainer.appendChild(list);
});
*/
const aisles = document.querySelectorAll('.aisle');
const toggleAislesBtn = document.getElementById('toggle-aisles');
let aislesVisible = true;

/*
toggleAislesBtn.addEventListener('click', () => {
  aislesVisible = !aislesVisible;
  aisles.forEach((aisle) => {
    aisle.style.display = aislesVisible ? 'block' : 'none';
  });
});
*/
// New?
const toggleAisleButtons = document.querySelectorAll('.toggle-aisle');
const aisleItemsContainers = document.querySelectorAll('.aisle-items');

toggleAisleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const aisle = button.getAttribute('data-aisle');
    const aisleItems = document.querySelector(`.aisle-items[data-aisle="${aisle}"]`);
    const isHidden = aisleItems.style.display === 'none';
    aisleItems.style.display = isHidden ? 'block' : 'none';
    button.textContent = isHidden ? `Hide Aisle ${aisle}` : `Show Aisle ${aisle}`;
  });
});
