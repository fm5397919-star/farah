let currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear();
let monthlyTasks = JSON.parse(localStorage.getItem('MONTH_DATA_V6')) || {};
let focusPoints = parseInt(localStorage.getItem('FOCUS_POINTS_V6')) || 0;
let activePriority = 'low';
let timer = null, timeLeft = 25 * 60, isWorkMode = true, isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initApp(); renderDays(); loadData(); updatePointsDisplay(); updateGlobalStats();
});

function initApp() {
    let name = localStorage.getItem('user_name') || prompt("ما اسمك؟");
    localStorage.setItem('user_name', name);
    document.getElementById('user-greeting').innerText = `أهلاً بك يا ${name}`;
}

// إضافة التاريخ بجانب اليوم في الأسبوع
function renderDays() {
    const grid = document.getElementById('daysGrid');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    grid.innerHTML = '';
    
    for(let i=0; i<7; i++) {
        let d = new Date();
        d.setDate(today.getDate() + i);
        let dateString = `${d.getDate()}/${d.getMonth() + 1}`;
        
        grid.innerHTML += `
            <div class="day-card">
                <div class="day-title-container">
                    <b>${days[d.getDay()]} <span class="date-badge">(${dateString})</span></b>
                    <div style="display:flex; gap:8px;">
                        <div class="priority-dot active" style="background:var(--accent)" onclick="setPriority('low', this)"></div>
                        <div class="priority-dot" style="background:var(--med)" onclick="setPriority('med', this)"></div>
                        <div class="priority-dot" style="background:var(--high)" onclick="setPriority('high', this)"></div>
                    </div>
                </div>
                <div class="input-wrapper">
                    <input type="text" id="in-${i}" placeholder="أضف مهمة...">
                    <button class="add-icon-btn" onclick="addTask(${i})">➕</button>
                </div>
                <ul id="list-${i}" style="padding:0; list-style:none;"></ul>
            </div>`;
    }
}

function setPriority(level, el) {
    activePriority = level;
    el.parentElement.querySelectorAll('.priority-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}

function addTask(id) {
    const input = document.getElementById(`in-${id}`);
    if(!input.value) return;
    createTaskElement(input.value, document.getElementById(`list-${id}`), activePriority, false);
    input.value = ''; saveData(); updateGlobalStats();
}

function createTaskElement(text, list, p, d) {
    const li = document.createElement('li');
    li.className = `task-item priority-${p} ${d ? 'done' : ''}`;
    li.innerHTML = `<span>${text}</span>
        <div>
            <button onclick="toggleTask(this)" style="background:none; border:none; cursor:pointer; color:var(--accent);">✔️</button>
            <button onclick="this.closest('.task-item').remove(); saveData(); updateGlobalStats();" style="background:none; border:none; cursor:pointer; color:#555;">🗑️</button>
        </div>`;
    list.prepend(li);
}

function toggleTask(btn) {
    btn.closest('.task-item').classList.toggle('done');
    document.getElementById('success-sound').play();
    saveData(); updateGlobalStats();
}

// البومودورو والتقويم
function resetTimer() {
    pauseTimer();
    timeLeft = (parseInt(document.getElementById('work-input').value) || 25) * 60;
    isWorkMode = true; updateTimerDisplay();
}
function startTimer() { if(isRunning) return; isRunning=true; timer = setInterval(() => { if(timeLeft>0){timeLeft--; updateTimerDisplay()} else completeSession(); }, 1000); }
function pauseTimer() { clearInterval(timer); isRunning=false; }
function updateTimerDisplay() { const m=Math.floor(timeLeft/60), s=timeLeft%60; document.getElementById('timer-display').innerText = `${m}:${s<10?'0'+s:s}`; }
function completeSession() { pauseTimer(); if(isWorkMode){ focusPoints+=10; localStorage.setItem('FOCUS_POINTS_V6', focusPoints); updatePointsDisplay(); timeLeft=(parseInt(document.getElementById('break-input').value)||5)*60; isWorkMode=false; } else resetTimer(); }
function updatePointsDisplay() { document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`; }
function updateGlobalStats() { const all = document.querySelectorAll('.task-item').length, done = document.querySelectorAll('.task-item.done').length; document.getElementById('total-tasks').innerText = all; document.getElementById('total-done').innerText = done; }

function switchView(v) {
    document.getElementById('weekly-view').style.display = v==='weekly'?'block':'none';
    document.getElementById('monthly-view').style.display = v==='monthly'?'block':'none';
    if(v==='monthly') renderCalendar();
    toggleSidebar();
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

function renderCalendar() {
    const grid = document.getElementById('calendarGrid'), days = new Date(currentYear, currentMonth + 1, 0).getDate(), start = new Date(currentYear, currentMonth, 1).getDay();
    document.getElementById('current-month-year').innerText = `${currentMonth + 1} / ${currentYear}`;
    grid.innerHTML = '';
    for(let i=0; i<start; i++) grid.innerHTML += '<div></div>';
    for(let d=1; d<=days; d++) {
        const key = `${d}-${currentMonth}-${currentYear}`;
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${key}', ${d})"><span>${d}</span>${monthlyTasks[key] ? '<div style="width:6px; height:6px; background:var(--accent); border-radius:50%; margin-top:5px;"></div>' : ''}</div>`;
    }
}
function changeMonth(dir) { currentMonth+=dir; if(currentMonth>11){currentMonth=0;currentYear++} if(currentMonth<0){currentMonth=11;currentYear--} renderCalendar(); }
function openModal(key, d) { selectedDate=key; document.getElementById('month-modal').style.display='flex'; document.getElementById('modal-date-title').innerText = `ملاحظات يوم ${d}`; document.getElementById('modal-task-input').value = monthlyTasks[key] || ''; }
function closeModal() { document.getElementById('month-modal').style.display='none'; }
function saveMonthTask() { monthlyTasks[selectedDate] = document.getElementById('modal-task-input').value; localStorage.setItem('MONTH_DATA_V6', JSON.stringify(monthlyTasks)); closeModal(); renderCalendar(); }

function saveData() {
    const data = {};
    document.querySelectorAll('.day-card').forEach((c, i) => {
        const tasks = [];
        c.querySelectorAll('.task-item').forEach(li => {
            tasks.push({ t: li.querySelector('span').innerText, p: li.classList.contains('priority-high') ? 'high' : li.classList.contains('priority-med') ? 'med' : 'low', d: li.classList.contains('done') });
        });
        data[i] = tasks;
    });
    localStorage.setItem('WEEKLY_DATA_V6', JSON.stringify(data));
}
function loadData() {
    const saved = JSON.parse(localStorage.getItem('WEEKLY_DATA_V6'));
    if(!saved) return;
    for(let i=0; i<7; i++) { if(saved[i]) saved[i].forEach(t => createTaskElement(t.t, document.getElementById(`list-${i}`), t.p, t.d)); }
}