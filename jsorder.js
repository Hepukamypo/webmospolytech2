document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. ЗАГРУЗКА МЕНЮ ---
    let dishes;
    try {
        const res = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        if (!res.ok) throw new Error('Сервер не отвечает: ' + res.status);
        const data = await res.json();
        
        // Приводим категории к нужному виду
        dishes = data.map(item => ({
            ...item,
            category: item.category === 'main-course' ? 'main' : 
                      item.category === 'salad' ? 'starter' : item.category,
            image: item.image.trim() || 'https://via.placeholder.com/400x300?text=No+Image'
        }));
    } catch (e) {
        console.error('Ошибка загрузки меню:', e);
        alert('Ошибка загрузки меню. Проверьте подключение к интернету.');
        return;
    }

    // --- 2. ПЕРЕМЕННЫЕ ---
    const selected = { soup: null, main: null, starter: null, drink: null, dessert: null };
    const totalEl = document.getElementById('total-container');

    // --- 3. ФУНКЦИИ ДЛЯ РАБОТЫ С localStorage ---
    function save() {
        const ids = {};
        for (let cat in selected) if (selected[cat]) ids[cat] = selected[cat].id;
        localStorage.setItem('selectedDishes', JSON.stringify(ids));
    }

    function load() {
        const saved = localStorage.getItem('selectedDishes');
        if (!saved) return;
        const ids = JSON.parse(saved);
        for (let cat in ids) {
            const dish = dishes.find(d => d.id == ids[cat]);
            if (dish) {
                selected[cat] = dish;
                displayDish(dish);
            }
        }
    }

    // --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function catTitle(cat) {
        return ({
            soup: 'Суп',
            main: 'Главное блюдо',
            starter: 'Салат/стартер',
            drink: 'Напиток',
            dessert: 'Десерт'
        })[cat];
    }

    function displayDish(d) {
        const el = document.getElementById(`${d.category}-container`);
        el.innerHTML = `<h4>${catTitle(d.category)}</h4>
            <div class="selected-dish">
                <span>${d.name}</span>
                <span>${d.price}₽</span>
            </div>`;
        selected[d.category] = d;
        calculateTotal();
        save();
    }

    function displayNoDish(cat) {
        const el = document.getElementById(`${cat}-container`);
        el.innerHTML = `<h4>${catTitle(cat)}</h4><span class="no-dish">Блюдо не выбрано</span>`;
        selected[cat] = null;
        calculateTotal();
        save();
    }

    function calculateTotal() {
        const total = Object.values(selected)
            .filter(Boolean)
            .reduce((s, d) => s + d.price, 0);
        if (totalEl) {
            totalEl.style.display = total ? 'block' : 'none';
            totalEl.innerHTML = `<strong>Стоимость заказа: ${total}₽</strong>`;
        }
    }

    function render(category, kind = null) {
        const idxMap = { soup: 1, main: 2, starter: 3, drink: 4, dessert: 5 };
        const idx = idxMap[category];
        if (!idx) return;

        const grid = document.querySelector(`.dishes-section:nth-of-type(${idx}) .dishes-grid`);
        if (!grid) return;

        grid.innerHTML = '';
        const filtered = dishes.filter(d => 
            d.category === category && (kind === null || d.kind === kind)
        );

        filtered.forEach(d => {
            const card = document.createElement('div');
            card.className = 'dish-card';
            card.innerHTML = `
                <img src="${d.image}" alt="${d.name}" class="dish-image">
                <p class="dish-price">${d.price}₽</p>
                <p class="dish-name">${d.name}</p>
                <p class="dish-weight">${d.count || ''}</p>
                <button type="button" class="dish-button">Добавить</button>
            `;
            card.onclick = () => displayDish(d);
            grid.appendChild(card);
        });
    }

    function setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = function() {
                const section = this.closest('.dishes-section');
                const sections = document.querySelectorAll('.dishes-section');
                const idx = Array.from(sections).indexOf(section) + 1;
                const catMap = [null, 'soup', 'main', 'starter', 'drink', 'dessert'];
                const category = catMap[idx];
                const kind = this.dataset.kind;

                section.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                
                if (!this.classList.contains('active')) {
                    this.classList.add('active');
                    render(category, kind);
                } else {
                    render(category, null);
                }
            };
        });
    }

    function validateCombo() {
        const { soup, main, starter, drink } = selected;
        return (
            (soup && main && starter && drink) ||
            (soup && main && drink) ||
            (soup && starter && drink) ||
            (main && starter && drink) ||
            (main && drink)
        );
    }

    function updateCheckoutPanel() {
        const panel = document.getElementById('checkout-panel');
        const link = document.getElementById('go-to-checkout');
        const total = Object.values(selected)
            .filter(Boolean)
            .reduce((s, d) => s + d.price, 0);

        if (!panel || !link) return;

        if (total === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'flex';
        document.getElementById('total-sum').textContent = `Итого: ${total}₽`;
        
        if (validateCombo()) {
            link.href = 'order.html';
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
            link.style.backgroundColor = '#4CAF50';
            link.style.color = 'white';
        } else {
            link.removeAttribute('href');
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';
            link.style.backgroundColor = '#ccc';
            link.style.color = '#666';
        }
    }

    // --- 5. ИНИЦИАЛИЗАЦИЯ ---
    ['soup', 'main', 'starter', 'drink', 'dessert'].forEach(cat => {
        if (document.getElementById(`${cat}-container`)) {
            displayNoDish(cat);
        }
    });
    
    ['soup', 'main', 'starter', 'drink', 'dessert'].forEach(cat => render(cat));
    setupFilters();
    load();

    // --- 6. СОЗДАНИЕ ПАНЕЛИ ПЕРЕХОДА ---
    const panel = document.createElement('div');
    panel.id = 'checkout-panel';
    panel.style.cssText = `
        position: sticky;
        bottom: 20px;
        left: 0;
        right: 0;
        background: white;
        padding: 15px 20px;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: none;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    `;
    
    panel.innerHTML = `
        <span id="total-sum">Итого: 0₽</span>
        <a id="go-to-checkout" 
           style="text-decoration: none; padding: 8px 16px; border-radius: 4px; font-weight: 500;">
            Перейти к оформлению
        </a>
    `;
    
    document.body.appendChild(panel);
    updateCheckoutPanel();
});