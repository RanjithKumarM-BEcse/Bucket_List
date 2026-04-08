// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let editingTaskId = null;

// DOM Elements
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const addBtn = document.getElementById('add-task-btn');
const modal = document.getElementById('task-modal');
const closeModal = document.getElementById('close-modal');
const taskForm = document.getElementById('task-form');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categoryFilter = document.getElementById('category-filter');

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearchAndSort();
    renderTasks();
});

// --- Modal Logic ---

addBtn.addEventListener('click', () => {
    editingTaskId = null;
    modal.querySelector('h2').textContent = 'New Goal';
    taskForm.reset();
    modal.classList.remove('hidden');
    document.getElementById('task-title').focus();
    // Default date to today
    document.getElementById('task-date').valueAsDate = new Date();
});

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    editingTaskId = null;
    taskForm.reset();
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        editingTaskId = null;
        taskForm.reset();
    }
});

// --- Task CRUD ---

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value
    };

    if (editingTaskId) {
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
        }
        editingTaskId = null;
    } else {
        const newTask = {
            id: Date.now(),
            ...taskData,
            completed: false,
            hidden: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveTasks();
    renderTasks();
    
    taskForm.reset();
    modal.classList.add('hidden');
});

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function hideTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.hidden = !task.hidden;
        saveTasks();
        renderTasks();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-category').value = task.category || 'Personal';
        
        modal.querySelector('h2').textContent = 'Edit Goal';
        modal.classList.remove('hidden');
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// --- Filtering & Sorting ---

function initFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

function initSearchAndSort() {
    searchInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);
    categoryFilter.addEventListener('change', renderTasks);
}

function getFilteredTasks() {
    const today = new Date().toISOString().split('T')[0];
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    let filtered = [...tasks];

    // Status Filter
    if (currentFilter === 'hidden') {
        filtered = tasks.filter(t => t.hidden);
    } else {
        filtered = tasks.filter(t => !t.hidden);
        
        if (currentFilter === 'today') {
            filtered = filtered.filter(t => t.date === today && !t.completed);
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }
    }

    // Category Filter
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Search Filter
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm) || 
            t.description.toLowerCase().includes(searchTerm)
        );
    }

    return sortTasks(filtered);
}

function sortTasks(taskList) {
    const sortType = sortSelect.value;
    const priorityMap = { 'high': 3, 'medium': 2, 'low': 1 };

    return taskList.sort((a, b) => {
        // Always keep completed at bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        if (sortType === 'priority-high') {
            if (priorityMap[a.priority] !== priorityMap[b.priority]) {
                return priorityMap[b.priority] - priorityMap[a.priority];
            }
        } else if (sortType === 'date-old') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        
        // Default: Newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

// --- Rendering ---

function renderTasks() {
    const displayTasks = getFilteredTasks();
    
    if (displayTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    taskList.innerHTML = displayTasks.map(task => {
        const isToday = task.date === new Date().toISOString().split('T')[0];
        const dateObj = new Date(task.date);
        const dateString = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; width: 100%;">
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        <span class="category-tag">${task.category}</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="action-btn" onclick="editTask(${task.id})" title="Edit Goal">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn" onclick="hideTask(${task.id})" title="${task.hidden ? 'Unhide' : 'Hide'} Goal">
                            ${task.hidden ? 
                                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>` : 
                                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                            }
                        </button>
                        <button class="delete-btn" onclick="deleteTask(${task.id})" aria-label="Delete Task">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>

                <div style="display: flex; gap: 1.25rem; width: 100%;">
                    <label class="checkbox-container">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                        <span class="checkmark"></span>
                    </label>
                    
                    <div class="task-content">
                        <h3 class="task-title">${task.title}</h3>
                        ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                        
                        <div class="task-footer">
                            <div class="task-meta">
                                ${isToday && !task.completed ? '<span class="tag-today">Today</span>' : ''}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                <span>Target: ${dateString}</span>
                            </div>
                            <span class="created-at">Created: ${createdDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
