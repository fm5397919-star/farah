// 1. إعدادات الأصوات والإشعارات
const workEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function sendAlert(title, message, type) {
    if (type === 'work') { workEndSound.play().catch(() => {}); } 
    else { breakEndSound.play().catch(() => {}); }

    if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: 'logo.png' });
    }
    alert(message);
}

// 2. المتغيرات العامة (البيانات)
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let tasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
let monthTasks = JSON.parse(localStorage.getItem('monthTasks')) || {};

// 3. نظام التايمر (Pomodoro)
let timerId = null;
let isWorkMode = true;
let workTime = 25;
let breakTime = 5;
let timeLeft = workTime * 60;

const timerDisplay = document.getElementById('timer-display');
const pomoLabel = document.getElementById('pomo-label');

function updateDisplay() {
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    if(timerDisplay) timerDisplay.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer() {
    if (timerId !== null) return;
    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerId);
            timerId = null;
            if (isWorkMode) {
                sendAlert("انتهى وقت العمل! 🎯", "خذ استراحة قصيرة.", 'work');
                isWorkMode = false;
                timeLeft = breakTime * 60;
                pomoLabel.innerText = "☕ وقت الراحة";
                addFocusPoints(10);
            } else {
                sendAlert("انتهت الراحة! 💪", "عد للعمل بنشاط.", 'break');
                isWorkMode = true;
                timeLeft = workTime * 60;
                pomoLabel.innerText = "🎯 وقت التركيز";
            }
            updateDisplay();
        }
    }, 1000);
}

function pauseTimer() { clearInterval(timerId); timerId = null; }

function resetTimer() {
    pauseTimer();
    workTime = parseInt(document.getElementById('work-input').value) || 25;
    breakTime = parseInt(document.getElementById('break-input').value) || 5;
    isWorkMode = true;
    timeLeft = workTime * 60;
    if(pomoLabel) pomoLabel.innerText = "🎯 وقت التركيز";
    updateDisplay();
}

// 4. نظام النقاط والترحيب
function addFocusPoints(pts) {
    focusPoints += pts;
    localStorage.setItem('focusPoints', focusPoints);
    updateHeader();
}

function updateHeader() {
    if(!userName) {
        userName = prompt("ما هو اسمك يا بطل؟") || "مستخدم متألق";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
    
    let badge = "🏅 مبتدئ";
    if(focusPoints > 100) badge = "🔥 مثابر";
    if(focusPoints > 500) badge = "👑 أسطورة التركيز";
    document.getElementById('user-badge').innerText = badge;
}

// 5. المنظم الأسبوعي (الأيام)
const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function renderWeekly() {
    const grid = document.getElementById('daysGrid');
    if(!grid) return;
    grid.innerHTML = '';
    days.forEach(day => {
        let dayTasks = tasks[day] || [];
        let html = `
            <div class="day-card">
                <h3>${day}</h3>
                <div class="input-group">
                    <input type="text" id="input-${day}" placeholder="إضافة مهمة...">
                    <button onclick="addTask('${day}')">+</button>
                </div>
                <ul class="task-list">
                    ${dayTasks.map((t, i) => `
                        <li class="${t.done ? 'done' : ''}">
                            <span onclick="toggleTask('${day}', ${i})">${t.text}</span>
                            <button class="del-btn" onclick="deleteTask('${day}', ${i})">×</button>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
        grid.innerHTML += html;
    });
    updateStats();
}

function addTask(day) {
    let input = document.getElementById(`input-${day}`);
    if(!input.value) return;
    if(!tasks[day]) tasks[day] = [];
    tasks[day].push({text: input.value, done: false});
    localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    input.value = '';
    renderWeekly();
}

function toggleTask(day, i) {
    tasks[day][i].done = !tasks[day][i].done;
    localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    renderWeekly();
}

function deleteTask(day, i) {
    tasks[day].splice(i, 1);
    localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    renderWeekly();
}

function updateStats() {
    let all = 0, done = 0;
    Object.values(tasks).forEach(d => d.forEach(t => { all++; if(t.done) done++; }));
    document.getElementById('total-tasks').innerText = all;
    document.getElementById('total-done').innerText = done;
    document.getElementById('total-perc').innerText = all ? Math.round((done/all)*100)+'%' : '0%';
}

// 6. تقويم الشهر
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    document.getElementById('current-month-year').innerText = 
        new Intl.DateTimeFormat('ar-SA', {month:'long', year:'numeric'}).format(new Date(currentYear, currentMonth));

    for(let i=0; i<firstDay; i++) grid.innerHTML += `<div></div>`;
    for(let d=1; d<=daysInMonth; d++) {
        let dateKey = `${currentYear}-${currentMonth}-${d}`;
        let hasNote = monthTasks[dateKey] ? '●' : '';
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${dateKey}')">${d} <small>${hasNote}</small></div>`;
    }
}

let activeDateKey = "";
function openModal(key) {
    activeDateKey = key;
    document.getElementById('month-modal').style.display = 'flex';
    document.getElementById('modal-task-input').value = monthTasks[key] || "";
}
function closeModal() { document.getElementById('month-modal').style.display = 'none'; }
function saveMonthTask() {
    monthTasks[activeDateKey] = document.getElementById('modal-task-input').value;
    localStorage.setItem('monthTasks', JSON.stringify(monthTasks));
    closeModal();
    renderCalendar();
}

function changeMonth(step) {
    currentMonth += step;
    if(currentMonth > 11) { currentMonth=0; currentYear++; }
    if(currentMonth < 0) { currentMonth=11; currentYear--; }
    renderCalendar();
}

// 7. التحكم في الواجهة (Sidebar)
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(view) {
    document.getElementById('weekly-view').style.display = view === 'weekly' ? 'block' : 'none';
    document.getElementById('monthly-view').style.display = view === 'monthly' ? 'block' : 'none';
    toggleSidebar();
}

// التشغيل الابتدائي
window.onload = () => {
    updateHeader();
    renderWeekly();
    renderCalendar();
    updateDisplay();
};