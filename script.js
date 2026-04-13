// --- 1. الأصوات والإشعارات ---
const workEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

if (Notification.permission !== "granted") { Notification.requestPermission(); }

function sendAlert(title, message, type) {
    if (type === 'work') workEndSound.play().catch(() => {});
    else breakEndSound.play().catch(() => {});
    if (Notification.permission === "granted") new Notification(title, { body: message, icon: 'logo.png' });
    alert(message);
}

// --- 2. البيانات والترحيب ---
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let tasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
let monthTasks = JSON.parse(localStorage.getItem('monthTasks')) || {};

function initApp() {
    if (!userName) {
        userName = prompt("أهلاً بك! ما هو اسمك؟") || "مستخدم متألق";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    renderWeekly();
    renderCalendar();
    updateStats();
    displayPoints();
}

// --- 3. المنظم الأسبوعي (التواريخ + الأهمية + الصح) ---
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function getWeekDates() {
    let now = new Date();
    let start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    let dates = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(`${d.getDate()}/${d.getMonth() + 1}`);
    }
    return dates;
}

function renderWeekly() {
    const grid = document.getElementById('daysGrid');
    const dates = getWeekDates();
    grid.innerHTML = '';

    dayNames.forEach((day, i) => {
        let dayTasks = tasks[day] || [];
        grid.innerHTML += `
            <div class="day-card">
                <h3>${day} <span class="date-label">(${dates[i]})</span></h3>
                <div class="input-group">
                    <input type="text" id="input-${day}" placeholder="مهمة...">
                    <select id="priority-${day}">
                        <option value="low">🟢</option>
                        <option value="medium">🟡</option>
                        <option value="high">🔴</option>
                    </select>
                    <button onclick="addTask('${day}')">+</button>
                </div>
                <ul class="task-list">
                    ${dayTasks.map((t, idx) => `
                        <li class="task-item ${t.priority} ${t.done ? 'done' : ''}">
                            <button class="check-btn" onclick="toggleTask('${day}', ${idx})">${t.done ? '✓' : ''}</button>
                            <span onclick="toggleTask('${day}', ${idx})">${t.text}</span>
                            <button class="del-btn" onclick="deleteTask('${day}', ${idx})">×</button>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
    });
    updateStats();
}

function addTask(day) {
    let input = document.getElementById(`input-${day}`);
    let priority = document.getElementById(`priority-${day}`).value;
    if (!input.value) return;
    if (!tasks[day]) tasks[day] = [];
    tasks[day].push({ text: input.value, done: false, priority: priority });
    saveAndRefresh();
    input.value = '';
}

function toggleTask(day, i) { tasks[day][i].done = !tasks[day][i].done; saveAndRefresh(); }
function deleteTask(day, i) { tasks[day].splice(i, 1); saveAndRefresh(); }
function saveAndRefresh() { localStorage.setItem('weeklyTasks', JSON.stringify(tasks)); renderWeekly(); }

// --- 4. التايمر والإحصائيات ---
let timerId = null, isWorkMode = true, timeLeft = 25 * 60;
function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--; updateTimerUI();
        } else {
            clearInterval(timerId); timerId = null;
            if (isWorkMode) {
                sendAlert("انتهى الوقت!", "خذ استراحة!", 'work');
                isWorkMode = false; timeLeft = document.getElementById('break-input').value * 60;
                addPoints(10);
            } else {
                sendAlert("انتهت الراحة!", "عد للعمل!", 'break');
                isWorkMode = true; timeLeft = document.getElementById('work-input').value * 60;
            }
            startTimer();
        }
    }, 1000);
}
function updateTimerUI() {
    let m = Math.floor(timeLeft/60), s = timeLeft%60;
    document.getElementById('timer-display').innerText = `${m}:${s<10?'0':''}${s}`;
}
function pauseTimer() { clearInterval(timerId); timerId = null; }
function resetTimer() { pauseTimer(); timeLeft = document.getElementById('work-input').value * 60; updateTimerUI(); }

function addPoints(p) { focusPoints += p; localStorage.setItem('focusPoints', focusPoints); displayPoints(); }
function displayPoints() {
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
    let b = "🏅 مبتدئ"; if(focusPoints > 100) b = "🔥 مثابر"; if(focusPoints > 500) b = "👑 أسطورة";
    document.getElementById('user-badge').innerText = b;
}

function updateStats() {
    let all = 0, d = 0;
    Object.values(tasks).forEach(list => list.forEach(t => { all++; if(t.done) d++; }));
    document.getElementById('total-tasks').innerText = all;
    document.getElementById('total-done').innerText = d;
    document.getElementById('total-perc').innerText = all ? Math.round((d/all)*100)+'%' : '0%';
}

// --- 5. التقويم والواجهة ---
let curM = new Date().getMonth(), curY = new Date().getFullYear();
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    let first = new Date(curY, curM, 1).getDay(), daysIn = new Date(curY, curM+1, 0).getDate();
    document.getElementById('current-month-year').innerText = new Intl.DateTimeFormat('ar-SA', {month:'long', year:'numeric'}).format(new Date(curY, curM));
    for(let i=0; i<first; i++) grid.innerHTML += `<div></div>`;
    for(let d=1; d<=daysIn; d++) {
        let k = `${curY}-${curM}-${d}`;
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${k}')">${d} ${monthTasks[k]?'<small>●</small>':''}</div>`;
    }
}
function openModal(k) { activeK = k; document.getElementById('month-modal').style.display='flex'; document.getElementById('modal-task-input').value=monthTasks[k]||""; }
function closeModal() { document.getElementById('month-modal').style.display='none'; }
function saveMonthTask() { monthTasks[activeK] = document.getElementById('modal-task-input').value; localStorage.setItem('monthTasks', JSON.stringify(monthTasks)); closeModal(); renderCalendar(); }
function changeMonth(s) { curM += s; if(curM>11){curM=0;curY++} if(curM<0){curM=11;curY--} renderCalendar(); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(v) {
    document.getElementById('weekly-view').style.display = v==='weekly'?'block':'none';
    document.getElementById('monthly-view').style.display = v==='monthly'?'block':'none';
    toggleSidebar();
}

window.onload = initApp;