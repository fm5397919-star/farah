// أصوات جوجل الرسمية المتفق عليها
const workSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

let allTasks = JSON.parse(localStorage.getItem('allTasks')) || {};
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let weekOffset = 0;
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function initApp() {
    if (!userName) {
        userName = prompt("أهلاً بك! ما هو اسمك؟") || "بطل الإنجاز";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    renderWeekly();
    renderCalendar();
    displayPoints();
    updateTimerUI();
}

// --- التنقل والمزامنة ---
function formatDateKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

function getWeekDates(offset) {
    let dates = [];
    let today = new Date();
    let sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + (offset * 7));
    for (let i = 0; i < 7; i++) {
        let d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function changeWeek(dir) { weekOffset += dir; renderWeekly(); }

function renderWeekly() {
    const grid = document.getElementById('daysGrid');
    const dates = getWeekDates(weekOffset);
    grid.innerHTML = '';
    document.getElementById('week-range-label').innerText = `${dates[0].getDate()}/${dates[0].getMonth()+1} - ${dates[6].getDate()}/${dates[6].getMonth()+1}`;

    dates.forEach((date, i) => {
        let key = formatDateKey(date);
        let dTasks = allTasks[key] || [];
        grid.innerHTML += `
            <div class="day-card" onclick="openModal('${key}')">
                <h3>${dayNames[i]} <span style="font-size:0.8rem; color:var(--neon-green)">(${date.getDate()}/${date.getMonth()+1})</span></h3>
                <div class="task-list">
                    ${dTasks.slice(0, 3).map(t => `<div class="task-item ${t.priority} ${t.done?'done':''}">${t.text}</div>`).join('')}
                    ${dTasks.length > 3 ? `<small style="color:var(--neon-blue)">+ ${dTasks.length - 3} مهام أخرى</small>` : ''}
                </div>
            </div>`;
    });
}

// --- التقويم الشهري ---
let curM = new Date().getMonth(), curY = new Date().getFullYear();
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    let first = new Date(curY, curM, 1).getDay();
    let days = new Date(curY, curM+1, 0).getDate();
    document.getElementById('current-month-year').innerText = new Intl.DateTimeFormat('ar-SA', {month:'long', year:'numeric'}).format(new Date(curY, curM));
    for(let i=0; i<first; i++) grid.innerHTML += `<div class="calendar-empty"></div>`;
    for(let d=1; d<=days; d++) {
        let key = formatDateKey(new Date(curY, curM, d));
        let hasTasks = (allTasks[key] && allTasks[key].length > 0) ? '<small style="color:var(--neon-green)"> ●</small>' : '';
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${key}')">${d}${hasTasks}</div>`;
    }
}

// --- نظام المهام ---
let activeDateKey = "";
function openModal(key) {
    activeDateKey = key;
    document.getElementById('task-modal').style.display = 'flex';
    renderModalTasks();
}
function closeModal() { document.getElementById('task-modal').style.display='none'; }

function renderModalTasks() {
    let list = allTasks[activeDateKey] || [];
    document.getElementById('modal-task-list').innerHTML = list.map((t, i) => `
        <div class="task-item ${t.priority} ${t.done ? 'done' : ''}">
            <span style="flex:1" onclick="toggleTask(${i})">${t.text}</span>
            <button class="del-btn" onclick="deleteTask(${i})">×</button>
        </div>`).join('');
}

function saveNewTask() {
    let inp = document.getElementById('modal-task-input');
    let prio = document.getElementById('modal-priority').value;
    if(!inp.value) return;
    if(!allTasks[activeDateKey]) allTasks[activeDateKey] = [];
    allTasks[activeDateKey].push({text: inp.value, done: false, priority: prio});
    saveAndRefresh();
    inp.value = '';
}
function toggleTask(i) { allTasks[activeDateKey][i].done = !allTasks[activeDateKey][i].done; saveAndRefresh(); }
function deleteTask(i) { allTasks[activeDateKey].splice(i, 1); saveAndRefresh(); }

function saveAndRefresh() {
    localStorage.setItem('allTasks', JSON.stringify(allTasks));
    renderModalTasks(); renderWeekly(); renderCalendar();
}

// --- البومودورو ---
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
                workSound.play(); alert("انتهى وقت العمل! خذ استراحة");
                isWork = false; timeLeft = document.getElementById('break-input').value * 60;
                focusPoints += 10; displayPoints();
            } else {
                breakSound.play(); alert("انتهت الاستراحة! عد للعمل");
                isWork = true; timeLeft = document.getElementById('work-input').value * 60;
            }
            startTimer();
        }
    }, 1000);
}
function pauseTimer() { clearInterval(timerId); timerId = null; }
function resetTimer() { pauseTimer(); timeLeft = document.getElementById('work-input').value * 60; updateTimerUI(); }

function displayPoints() {
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
    let b = "🏅 مبتدئ"; if(focusPoints>100) b = "🔥 مثابر"; if(focusPoints>500) b = "👑 أسطورة";
    document.getElementById('user-badge').innerText = b;
    localStorage.setItem('focusPoints', focusPoints);
}

// --- واجهة المستخدم ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(v) {
    document.getElementById('weekly-view').style.display = v==='weekly'?'block':'none';
    document.getElementById('monthly-view').style.display = v==='monthly'?'block':'none';
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(v === 'weekly' ? 'btn-weekly' : 'btn-monthly').classList.add('active');
    toggleSidebar();
}
function changeMonth(s) { curM += s; if(curM>11){curM=0;curY++} if(curM<0){curM=11;curY--} renderCalendar(); }

window.onload = initApp;