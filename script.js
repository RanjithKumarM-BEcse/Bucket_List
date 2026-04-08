// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// DOM Elements
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const addBtn = document.getElementById('add-task-btn');
const modal = document.getElementById('task-modal');
const closeModal = document.getElementById('close-modal');
const taskForm = document.getElementById('task-form');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    renderTasks();
});

// --- Modal Logic ---

addBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.getElementById('task-title').focus();
    // Default date to today
    document.getElementById('task-date').valueAsDate = new Date();
});

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

// --- Task CRUD ---

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTask = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
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

function getFilteredTasks() {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = [...tasks];

    if (currentFilter === 'today') {
        filtered = tasks.filter(t => t.date === today && !t.completed);
    } else if (currentFilter === 'upcoming') {
        filtered = tasks.filter(t => t.date > today && !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = tasks.filter(t => t.completed);
    }

    return sortTasks(filtered);
}

function sortTasks(taskList) {
    const today = new Date().toISOString().split('T')[0];

    return taskList.sort((a, b) => {
        // Rule 1: Completed items go to the bottom
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // Rule 2: Today's items go above others (if not completed)
        if (!a.completed) {
            const isAToday = a.date === today;
            const isBToday = b.date === today;
            if (isAToday !== isBToday) return isAToday ? -1 : 1;
        }

        // Rule 3: Sort by date
        return new Date(a.date) - new Date(b.date);
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

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                    <span class="checkmark"></span>
                </label>
                
                <div class="task-content">
                    <h3 class="task-title">${task.title}</h3>
                    ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                    <div class="task-meta">
                        ${isToday && !task.completed ? '<span class="tag-today">Today</span>' : ''}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${dateString}</span>
                    </div>
                </div>

                <button class="delete-btn" onclick="deleteTask(${task.id})" aria-label="Delete Task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
    }).join('');
}
