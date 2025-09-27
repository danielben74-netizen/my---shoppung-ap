// script.js
const form = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemCategorySelect = document.getElementById('item-category');
const shoppingListsContainer = document.getElementById('shopping-lists');

const exportJsonButton = document.getElementById('export-json-btn');
const importJsonButton = document.getElementById('import-json-btn');
const importJsonInput = document.getElementById('import-json-input');

// New elements for the lock functionality
const lockButton = document.getElementById('lock-btn');
const lockIcon = document.getElementById('lock-icon');

// New element for the share functionality
const shareListButton = document.getElementById('share-list-btn');

// **אלמנטים חדשים למודל השיתוף**
const shareModal = document.getElementById('share-modal');
const shareTextArea = document.getElementById('share-text-area');
const copyButton = document.getElementById('copy-btn');
const closeModalButton = document.getElementById('close-modal-btn');
// **סוף אלמנטים חדשים**


let shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || {};
let lastSelectedCategory = null;
let draggedItem = null;

// Set initial state to locked
let isLocked = true;

function saveList() {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
}

function createListItem(item, category) {
    const li = document.createElement('li');
    li.classList.add('selectable');
    li.draggable = !isLocked;
    li.dataset.category = category;
    li.dataset.itemName = item.name;

    li.innerHTML = `
        <span>${item.name}</span>
        <select class="quantity-select">
            ${Array.from({length: 10}, (_, i) => `<option value="${i}" ${i === item.quantity ? 'selected' : ''}>${i}</option>`).join('')}
        </select>
        <button class="delete-btn">X</button>
    `;
    li.classList.toggle('selected', item.selected);

    li.addEventListener('click', () => {
        item.selected = !item.selected;
        li.classList.toggle('selected', item.selected);
        saveList();
    });

    const quantitySelect = li.querySelector('.quantity-select');
    quantitySelect.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    quantitySelect.addEventListener('change', (e) => {
        e.stopPropagation();
        item.quantity = parseInt(e.target.value);
        saveList();
    });
    
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteItem(category, item.name);
    });
    
    return li;
}

function renderList() {
    const categories = ["ירקות ופירות", "קפואים", "שימורים", "כללי", "שתיה", "פיצוחים וקטניות", "מוצרי חלב", "ניקיון", "חטיפים"];

    categories.forEach(category => {
        const ul = document.getElementById(category);
        if (ul) {
            ul.innerHTML = '';
            const items = shoppingList[category] || [];
            items.forEach(item => {
                const li = createListItem(item, category);
                ul.appendChild(li);
            });
        }
    });
    
    // Set the initial state of the lock icon and draggable items
    lockIcon.textContent = isLocked ? '🔒' : '🔓';
    lockIcon.dataset.locked = isLocked;
    const allItems = document.querySelectorAll('li.selectable');
    allItems.forEach(item => {
        item.draggable = !isLocked;
    });
}

function deleteItem(category, itemName) {
    if (shoppingList[category]) {
        const itemIndex = shoppingList[category].findIndex(item => item.name === itemName);
        if (itemIndex > -1) {
            shoppingList[category].splice(itemIndex, 1);
            saveList();
            
            const ul = document.getElementById(category);
            const li = ul.querySelector(`[data-item-name="${itemName}"]`);
            if (li) {
                li.remove();
            }
        }
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const category = itemCategorySelect.value;
    
    if (name === "" || category === "") return;

    if (!shoppingList[category]) {
        shoppingList[category] = [];
    }
    
    const itemExists = shoppingList[category].some(item => item.name === name);
    if (!itemExists) {
        const newItem = { name: name, selected: false, quantity: 1 };
        shoppingList[category].push(newItem);
        saveList();
        
        const ul = document.getElementById(category);
        const li = createListItem(newItem, category);
        ul.appendChild(li);
    }
    
    itemNameInput.value = '';
    lastSelectedCategory = category;
    itemCategorySelect.value = lastSelectedCategory;
});

// Drag and Drop Logic (נשאר ללא שינוי)
shoppingListsContainer.addEventListener('dragstart', (e) => {
    if (isLocked) {
        e.preventDefault();
        return;
    }
    if (e.target.tagName === 'LI') {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.itemName);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
});

shoppingListsContainer.addEventListener('dragover', (e) => {
    if (isLocked) {
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const ul = e.target.closest('ul');
    if (ul && ul.id === draggedItem.dataset.category) {
        const afterElement = getDragAfterElement(ul, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            ul.appendChild(draggable);
        } else {
            ul.insertBefore(draggable, afterElement);
        }
    }
});

shoppingListsContainer.addEventListener('dragend', () => {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        
        const sourceCategory = draggedItem.dataset.category;
        const ul = document.getElementById(sourceCategory);
        const newOrderNodes = Array.from(ul.querySelectorAll('li'));
        
        const newItemsOrder = [];
        newOrderNodes.forEach(node => {
            const itemName = node.dataset.itemName;
            const originalItem = shoppingList[sourceCategory].find(item => item.name === itemName);
            if (originalItem) {
                newItemsOrder.push(originalItem);
            }
        });
        
        shoppingList[sourceCategory] = newItemsOrder;
        saveList();
    }
    draggedItem = null;
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
// סוף Drag and Drop Logic


// Export and Import Logic (נשאר ללא שינוי)
exportJsonButton.addEventListener('click', () => {
    const dataStr = JSON.stringify(shoppingList, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shoppingList_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("רשימת הקניות יצאה לקובץ shoppingList_data.json!");
});

importJsonButton.addEventListener('click', () => {
    importJsonInput.click();
});

importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedList = JSON.parse(event.target.result);
            if (importedList && typeof importedList === 'object') {
                shoppingList = importedList;
                renderList();
                saveList();
                alert("רשימת הקניות יובאה בהצלחה!");
            } else {
                alert("שגיאה: קובץ JSON לא תקין.");
            }
        } catch (error) {
            alert("שגיאה בייבוא הקובץ. ודא שהוא בפורמט JSON נכון.");
            console.error(error);
        }
    };
    reader.readAsText(file);
});


lockButton.addEventListener('click', () => {
    isLocked = !isLocked;
    lockIcon.textContent = isLocked ? '🔒' : '🔓';
    lockIcon.dataset.locked = isLocked;
    
    const allItems = document.querySelectorAll('li.selectable');
    allItems.forEach(item => {
        item.draggable = !isLocked;
    });
});

// **פונקציה ליצירת טקסט פשוט לשיתוף**
function formatShoppingListForShare() {
    let text = "רשימת הקניות שלי:\n\n";
    const categories = ["ירקות ופירות", "קפואים", "שימורים", "כללי", "שתיה", "פיצוחים וקטניות", "מוצרי חלב", "ניקיון", "חטיפים"];

    categories.forEach(category => {
        const items = (shoppingList[category] || []).filter(item => !item.selected);
        
        if (items.length > 0) {
            text += `* ${category}:` + '\n';
            items.forEach(item => {
                const quantityText = item.quantity !== undefined && item.quantity > 0 ? ` (${item.quantity} יח')` : '';
                text += `- ${item.name}${quantityText}` + '\n';
            });
            text += '\n'; // הוספת רווח בין קטגוריות
        }
    });
    return text;
}


// **לוגיקת כפתור השיתוף - פתיחת מודל העתקה**
shareListButton.addEventListener('click', () => {
    const listText = formatShoppingListForShare();

    if (listText.trim() === "רשימת הקניות שלי:") {
        alert('הרשימה ריקה! הוסף מוצרים כדי לשתף.');
        return;
    }

    // הצגת הטקסט במודל
    shareTextArea.value = listText;
    shareModal.style.display = 'block';

    // בחירת הטקסט אוטומטית (עשוי לעבוד רק בחלק מהמכשירים)
    shareTextArea.select();
});


// **לוגיקת כפתור ההעתקה בתוך המודל**
copyButton.addEventListener('click', () => {
    shareTextArea.select();
    
    try {
        const successful = document.execCommand('copy'); // שיטה ישנה, אך נתמכת יותר ב-APK
        if (successful) {
            alert('הרשימה הועתקה ללוח! ניתן להדביק בוואטסאפ/מייל.');
            shareModal.style.display = 'none';
        } else {
            // אם execCommand נכשל, מנסים את ה-API המודרני
            navigator.clipboard.writeText(shareTextArea.value).then(() => {
                alert('הרשימה הועתקה ללוח! ניתן להדביק בוואטסאפ/מייל.');
                shareModal.style.display = 'none';
            }).catch(() => {
                alert('שגיאה: העתקה אוטומטית נכשלה. אנא העתק ידנית את הטקסט מהתיבה.');
            });
        }
    } catch (err) {
        // מנגנון חלופי אחרון
        alert('שגיאה: העתקה אוטומטית נכשלה. אנא העתק ידנית את הטקסט מהתיבה.');
    }
});


// **לוגיקת סגירת המודל**
closeModalButton.addEventListener('click', () => {
    shareModal.style.display = 'none';
});

if (lastSelectedCategory) {
    itemCategorySelect.value = lastSelectedCategory;
}

renderList();