// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all', editingTaskId = null;

// DOM Elements Shorthand
const $ = id => document.getElementById(id);
const taskList = $('task-list'), emptyState = $('empty-state'), modal = $('task-modal'), taskForm = $('task-form');
const searchInput = $('search-input'), sortSelect = $('sort-select'), categoryFilter = $('category-filter');
const filterBtns = document.querySelectorAll('.filter-btn');

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    [searchInput, sortSelect, categoryFilter].forEach(el => el.addEventListener('input', renderTasks));
    renderTasks();
});

// Modal Helpers
const toggleModal = (show) => {
    modal.classList.toggle('hidden', !show);
    if (!show) { editingTaskId = null; taskForm.reset(); }
};
$('add-task-btn').addEventListener('click', () => {
    editingTaskId = null;
    modal.querySelector('h2').textContent = 'New Goal';
    taskForm.reset();
    toggleModal(true);
    $('task-title').focus();
    $('task-date').valueAsDate = new Date();
});
$('close-modal').addEventListener('click', () => toggleModal(false));
modal.addEventListener('click', (e) => { if (e.target === modal) toggleModal(false); });

// Task CRUD
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskData = {
        title: $('task-title').value,
        description: $('task-desc').value,
        date: $('task-date').value,
        priority: $('task-priority').value,
        category: $('task-category').value
    };

    if (editingTaskId) {
        const idx = tasks.findIndex(t => t.id === editingTaskId);
        if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
    } else {
        tasks.push({ id: Date.now(), ...taskData, completed: false, hidden: false, createdAt: new Date().toISOString() });
    }
    saveAndRender();
    toggleModal(false);
});

const saveAndRender = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
};

const updateTask = (id, callback) => {
    const task = tasks.find(t => t.id === id);
    if (task) callback(task);
    saveAndRender();
};

const deleteTask = id => { tasks = tasks.filter(t => t.id !== id); saveAndRender(); };
const toggleTask = id => updateTask(id, t => t.completed = !t.completed);
const hideTask = id => updateTask(id, t => t.hidden = !t.hidden);

const editTask = id => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = task.id;
        $('task-title').value = task.title;
        $('task-desc').value = task.description || '';
        $('task-date').value = task.date;
        $('task-priority').value = task.priority || 'medium';
        $('task-category').value = task.category || 'Personal';
        modal.querySelector('h2').textContent = 'Edit Goal';
        modal.classList.remove('hidden');
    }
};

// Filter & Sort
const initFilters = () => filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    const filtered = tasks.filter(t => {
        if (currentFilter === 'hidden') return t.hidden;
        if (t.hidden) return false;
        if (currentFilter === 'today' && (t.date !== today || t.completed)) return false;
        if (currentFilter === 'completed' && !t.completed) return false;
        if (category !== 'all' && t.category !== category) return false;
        if (search && !t.title.toLowerCase().includes(search) && !t.description.toLowerCase().includes(search)) return false;
        return true;
    });

    const priorityMap = { 'high': 3, 'medium': 2, 'low': 1 };
    const sortType = sortSelect.value;
    
    return filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (sortType === 'priority-high') {
            if (priorityMap[a.priority] !== priorityMap[b.priority]) return priorityMap[b.priority] - priorityMap[a.priority];
        } else if (sortType === 'date-old') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
};

const toggleTaskMenu = id => {
    document.querySelectorAll('.card-dropdown').forEach(m => {
        if (m.id !== `menu-${id}`) m.classList.add('hidden');
    });
    const menu = $(`menu-${id}`);
    if (menu) menu.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-menu-container')) {
        document.querySelectorAll('.card-dropdown').forEach(m => m.classList.add('hidden'));
    }
});

// Render Elements
const renderTasks = () => {
    const displayTasks = getFilteredTasks();
    if (displayTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    taskList.innerHTML = displayTasks.map(task => {
        const dateString = new Date(task.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="card-top">
                    <div class="title-date-group">
                        <label class="checkbox-container">
                            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                            <span class="checkmark"></span>
                        </label>
                        <h3 class="task-title">${task.title}</h3>
                    </div>
                    <div class="card-menu-container">
                        <button class="menu-dots-btn" onclick="toggleTaskMenu(${task.id})" title="Actions">•••</button>
                        <div id="menu-${task.id}" class="card-dropdown hidden">
                            <button onclick="editTask(${task.id})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit
                            </button>
                            <button onclick="hideTask(${task.id})">
                                ${task.hidden ? 
                                    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Unhide` : 
                                    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg> Hide`
                                }
                            </button>
                            <button class="delete-opt" onclick="deleteTask(${task.id})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path></svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                <div class="card-bottom">
                    <div class="tags-group">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        <span class="category-tag">${task.category}</span>
                        <span class="created-at">Created: ${createdDate}</span>
                        <div class="end-date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
                            Target: ${dateString}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};
