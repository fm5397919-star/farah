// --- 1. التنبيهات والأصوات ---
const workEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

function notify(title, msg, type) {
    if (type === 'work') workEndSound.play().catch(()=>{});
    else breakEndSound.play().catch(()=>{});

    if (Notification.permission === "granted") {
        new Notification(title, { body: msg, icon: 'logo.png' });
    }
    alert(msg);
}

// --- 2. البيانات والترحيب ---
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let tasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
let monthTasks = JSON.parse(localStorage.getItem('monthTasks')) || {};

function initApp() {
    if (!userName) {
        userName = prompt("مرحباً بك في منظمك الجديد! ما اسمك؟") || "مستخدم متألق";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    updateStats();
    renderWeekly();
    renderCalendar();
}

// --- 3. المنظم الأسبوعي والتواريخ ---
function getWeekDates() {
    let now = new Date();
    let dayOfWeek = now.getDay(); // 0 (الأحد) إلى 6 (السبت)
    let startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek); // العودة ليوم الأحد

    let dates = [];
    for (let i = 0; i < 7; i++) {
        let tempDate = new Date(startOfWeek);
        tempDate.setDate(startOfWeek.getDate() + i);
        dates.push(`${tempDate.getDate()}/${tempDate.getMonth() + 1}`);
    }
    return dates;
}

const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function renderWeekly() {
    const grid = document.getElementById('daysGrid');
    const weekDates = getWeekDates();
    grid.innerHTML = '';

    dayNames.forEach((day, index) => {
        let dayTasks = tasks[day] || [];
        grid.innerHTML += `
            <div class="day-card">
                <h3>${day} <span class="date-label">${weekDates[index]}</span></h3>
                <div class="input-group">
                    <input type="text" id="input-${day}" placeholder="مهمة جديدة...">
                    <button onclick="addTask('${day}')">+</button>
                </div>
                <ul class="task-list">
                    ${dayTasks.map((t, i) => `
                        <li class="${t.done ? 'done' : ''}">
                            <span onclick="toggleTask('${day}', ${i})">${t.text}</span>
                            <button onclick="deleteTask('${day}', ${i})">×</button>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
    });
}

function addTask(day) {
    let input = document.getElementById(`input-${day}`);
    if (!input.value) return;
    if (!tasks[day]) tasks[day] = [];
    tasks[day].push({ text: input.value, done: false });
    saveAndRender();
    input.value = '';
}

function toggleTask(day, i) { tasks[day][i].done = !tasks[day][i].done; saveAndRender(); }
function deleteTask(day, i) { tasks[day].splice(i, 1); saveAndRender(); }
function saveAndRender() {
    localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    renderWeekly();
    updateStats();
}

// --- 4. التايمر (Pomodoro) ---
let timerId = null, isWorkMode = true, timeLeft = 25 * 60;
function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            let m = Math.floor(timeLeft/60), s = timeLeft%60;
            document.getElementById('timer-display').innerText = `${m}:${s<10?'0':''}${s}`;
        } else {
            clearInterval(timerId); timerId = null;
            if (isWorkMode) {
                notify("انتهى العمل!", "وقت الاستراحة يا بطل!", 'work');
                isWorkMode = false; timeLeft = document.getElementById('break-input').value * 60;
                addPoints(10);
            } else {
                notify("انتهت الراحة!", "عد للتركيز الآن!", 'break');
                isWorkMode = true; timeLeft = document.getElementById('work-input').value * 60;
            }
            startTimer();
        }
    }, 1000);
}
function pauseTimer() { clearInterval(timerId); timerId = null; }
function resetTimer() { pauseTimer(); timeLeft = document.getElementById('work-input').value * 60; document.getElementById('timer-display').innerText = "25:00"; }

// --- 5. النقاط والتقويم (باقي الكود المعتاد) ---
function addPoints(p) {
    focusPoints += p;
    localStorage.setItem('focusPoints', focusPoints);
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
}

function updateStats() {
    let all = 0, done = 0;
    Object.values(tasks).forEach(d => d.forEach(t => { all++; if(t.done) done++; }));
    document.getElementById('total-tasks').innerText = all;
    document.getElementById('total-done').innerText = done;
    document.getElementById('total-perc').innerText = all ? Math.round((done/all)*100)+'%' : '0%';
}

// (أكواد التقويم والتبديل تبقى كما هي لضمان الاستقرار)
let curM = new Date().getMonth(), curY = new Date().getFullYear();
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if(!grid) return; grid.innerHTML = '';
    const first = new Date(curY, curM, 1).getDay();
    const daysIn = new Date(curY, curM+1, 0).getDate();
    document.getElementById('current-month-year').innerText = new Intl.DateTimeFormat('ar-SA', {month:'long', year:'numeric'}).format(new Date(curY, curM));
    for(let i=0; i<first; i++) grid.innerHTML += `<div></div>`;
    for(let d=1; d<=daysIn; d++) {
        let key = `${curY}-${curM}-${d}`;
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${key}')">${d} ${monthTasks[key]?'<small>●</small>':''}</div>`;
    }
}
function changeMonth(s) { curM += s; if(curM>11){curM=0;curY++} if(curM<0){curM=11;curY--} renderCalendar(); }
function openModal(k) { activeK = k; document.getElementById('month-modal').style.display='flex'; document.getElementById('modal-task-input').value=monthTasks[k]||""; }
function closeModal() { document.getElementById('month-modal').style.display='none'; }
function saveMonthTask() { monthTasks[activeK] = document.getElementById('modal-task-input').value; localStorage.setItem('monthTasks', JSON.stringify(monthTasks)); closeModal(); renderCalendar(); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(v) { document.getElementById('weekly-view').style.display = v==='weekly'?'block':'none'; document.getElementById('monthly-view').style.display = v==='monthly'?'block':'none'; toggleSidebar(); }

window.onload = initApp;