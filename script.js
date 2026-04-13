// الأصوات
const workSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

// البيانات والتشغيل
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let tasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
let monthTasks = JSON.parse(localStorage.getItem('monthTasks')) || {};
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function initApp() {
    if (!userName) {
        userName = prompt("مرحباً! ما هو اسمك؟") || "مستخدم متألق";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    renderWeekly();
    renderCalendar();
    updateStats();
    displayPoints();
}

// الأسبوع والتواريخ
function getWeekDates() {
    let now = new Date();
    let start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // البداية من الأحد
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
        let dTasks = tasks[day] || [];
        grid.innerHTML += `
            <div class="day-card">
                <h3>${day} <span style="font-size:0.8rem; color:var(--neon-green)">(${dates[i]})</span></h3>
                <div class="input-group">
                    <input type="text" id="in-${day}" placeholder="مهمة جديدة...">
                    <select id="pr-${day}" style="background:#333; color:white; border:none; border-radius:5px;">
                        <option value="low">🟢</option><option value="medium">🟡</option><option value="high">🔴</option>
                    </select>
                    <button onclick="addTask('${day}')" style="background:var(--neon-green); border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">+</button>
                </div>
                <ul class="task-list">
                    ${dTasks.map((t, idx) => `
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
    let input = document.getElementById(`in-${day}`);
    let prio = document.getElementById(`pr-${day}`).value;
    if (!input.value) return;
    if (!tasks[day]) tasks[day] = [];
    tasks[day].push({ text: input.value, done: false, priority: prio });
    localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    input.value = ''; renderWeekly();
}

function toggleTask(day, i) { tasks[day][i].done = !tasks[day][i].done; localStorage.setItem('weeklyTasks', JSON.stringify(tasks)); renderWeekly(); }
function deleteTask(day, i) { tasks[day].splice(i, 1); localStorage.setItem('weeklyTasks', JSON.stringify(tasks)); renderWeekly(); }

// البومودورو
let timerId = null, isWork = true, timeLeft = 25 * 60;
function updateTimerUI() {
    let m = Math.floor(timeLeft/60), s = timeLeft%60;
    document.getElementById('timer-display').innerText = `${m}:${s<10?'0':''}${s}`;
}
function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        if (timeLeft > 0) { timeLeft--; updateTimerUI(); }
        else {
            clearInterval(timerId); timerId = null;
            if (isWork) {
                workSound.play().catch(()=>{}); alert("انتهى العمل! خذ استراحة");
                isWork = false; timeLeft = document.getElementById('break-input').value * 60;
                focusPoints += 10; displayPoints();
            } else {
                breakSound.play().catch(()=>{}); alert("انتهت الراحة! عد للعمل");
                isWork = true; timeLeft = document.getElementById('work-input').value * 60;
            }
            startTimer();
        }
    }, 1000);
}
function pauseTimer() { clearInterval(timerId); timerId = null; }
function resetTimer() { pauseTimer(); timeLeft = document.getElementById('work-input').value * 60; updateTimerUI(); }

// التقويم
let curM = new Date().getMonth(), curY = new Date().getFullYear();
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    let first = new Date(curY, curM, 1).getDay();
    let days = new Date(curY, curM+1, 0).getDate();
    document.getElementById('current-month-year').innerText = new Intl.DateTimeFormat('ar-SA', {month:'long', year:'numeric'}).format(new Date(curY, curM));
    for(let i=0; i<first; i++) grid.innerHTML += `<div class="calendar-empty"></div>`;
    for(let d=1; d<=days; d++) {
        let key = `${curY}-${curM}-${d}`;
        let dots = (monthTasks[key] && monthTasks[key].length > 0) ? '<small style="color:var(--neon-green)">●</small>' : '';
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${key}')">${d} ${dots}</div>`;
    }
}

let activeKey = "";
function openModal(k) { activeKey = k; document.getElementById('month-modal').style.display='flex'; renderMonthTasks(); }
function closeModal() { document.getElementById('month-modal').style.display='none'; }
function renderMonthTasks() {
    let list = monthTasks[activeKey] || [];
    document.getElementById('modal-task-list').innerHTML = list.map((t, i) => `
        <div class="task-item ${t.done ? 'done' : ''}">
            <span onclick="toggleMTask(${i})">${t.text}</span>
            <button class="del-btn" onclick="deleteMTask(${i})">×</button>
        </div>`).join('');
}
function addMonthTask() {
    let inp = document.getElementById('modal-task-input'); if(!inp.value) return;
    if(!monthTasks[activeKey]) monthTasks[activeKey] = [];
    monthTasks[activeKey].push({text: inp.value, done: false});
    localStorage.setItem('monthTasks', JSON.stringify(monthTasks)); inp.value = ''; renderMonthTasks(); renderCalendar();
}
function toggleMTask(i) { monthTasks[activeKey][i].done = !monthTasks[activeKey][i].done; localStorage.setItem('monthTasks', JSON.stringify(monthTasks)); renderMonthTasks(); }
function deleteMTask(i) { monthTasks[activeKey].splice(i, 1); localStorage.setItem('monthTasks', JSON.stringify(monthTasks)); renderMonthTasks(); renderCalendar(); }

// إحصائيات ونقاط
function displayPoints() {
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
    let b = "🏅 مبتدئ"; if(focusPoints>100) b = "🔥 مثابر"; if(focusPoints>500) b = "👑 أسطورة";
    document.getElementById('user-badge').innerText = b; localStorage.setItem('focusPoints', focusPoints);
}
function updateStats() {
    let all = 0, d = 0;
    Object.values(tasks).forEach(list => list.forEach(t => { all++; if(t.done) d++; }));
    document.getElementById('total-tasks').innerText = all;
    document.getElementById('total-done').innerText = d;
    document.getElementById('total-perc').innerText = all ? Math.round((d/all)*100)+'%' : '0%';
}

function changeMonth(s) { curM += s; if(curM>11){curM=0;curY++} if(curM<0){curM=11;curY--} renderCalendar(); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(v) {
    document.getElementById('weekly-view').style.display = v==='weekly'?'block':'none';
    document.getElementById('monthly-view').style.display = v==='monthly'?'block':'none';
    toggleSidebar();
}

window.onload = initApp;