// --- 1. إعدادات الأصوات والتنبيهات ---
const workEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

// طلب إذن الإشعارات من المتصفح
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function sendAlert(title, message, type) {
    // تشغيل الصوت
    if (type === 'work') {
        workEndSound.play().catch(() => console.log("تفاعل مع الصفحة لتفعيل الصوت"));
    } else {
        breakEndSound.play().catch(() => console.log("تفاعل مع الصفحة لتفعيل الصوت"));
    }

    // إرسال إشعار للنظام
    if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: 'logo.png' });
    }
    
    // تنبيه منبثق
    alert(message);
}

// --- 2. البيانات الأساسية ---
let userName = localStorage.getItem('userName') || "";
let focusPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
let tasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
let monthTasks = JSON.parse(localStorage.getItem('monthTasks')) || {};

// --- 3. نظام التايمر (Pomodoro) ---
let timerId = null;
let isWorkMode = true;
let timeLeft = 25 * 60;

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    if (display) display.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer() {
    if (timerId !== null) return;
    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerId);
            timerId = null;
            if (isWorkMode) {
                sendAlert("انتهى وقت العمل! 🎯", "برافو! خذ استراحة قصيرة الآن.", 'work');
                isWorkMode = false;
                timeLeft = (document.getElementById('break-input').value || 5) * 60;
                document.getElementById('pomo-label').innerText = "☕ وقت الراحة";
                addFocusPoints(10);
            } else {
                sendAlert("انتهت الراحة! 💪", "يلا يا بطل، ارجع للتركيز!", 'break');
                isWorkMode = true;
                timeLeft = (document.getElementById('work-input').value || 25) * 60;
                document.getElementById('pomo-label').innerText = "🎯 وقت التركيز";
            }
            updateTimerDisplay();
        }
    }, 1000);
}

function pauseTimer() { clearInterval(timerId); timerId = null; }

function resetTimer() {
    pauseTimer();
    let w = document.getElementById('work-input').value || 25;
    timeLeft = w * 60;
    isWorkMode = true;
    document.getElementById('pomo-label').innerText = "🎯 وقت التركيز";
    updateTimerDisplay();
}

// --- 4. المنظم الأسبوعي مع التواريخ ---
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function getWeekDates() {
    let now = new Date();
    let dayIdx = now.getDay(); 
    let start = new Date(now);
    start.setDate(now.getDate() - dayIdx); // العودة للأحد

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
    if (!grid) return;
    const dates = getWeekDates();
    grid.innerHTML = '';

    dayNames.forEach((day, i) => {
        let dayTasks = tasks[day] || [];
        grid.innerHTML += `
            <div class="day-card">
                <h3>${day} <span class="date-label" style="font-size:0.7em; color:#00ffcc; margin-right:5px;">(${dates[i]})</span></h3>
                <div class="input-group">
                    <input type="text" id="input-${day}" placeholder="إضافة مهمة...">
                    <button onclick="addTask('${day}')">+</button>
                </div>
                <ul class="task-list">
                    ${dayTasks.map((t, idx) => `
                        <li class="${t.done ? 'done' : ''}">
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
    if (!input.value) return;
    if (!tasks[day]) tasks[day] = [];
    tasks[day].push({ text: input.value, done: false });
    saveTasks();
    input.value = '';
    renderWeekly();
}

function toggleTask(day, i) { tasks[day][i].done = !tasks[day][i].done; saveTasks(); renderWeekly(); }
function deleteTask(day, i) { tasks[day].splice(i, 1); saveTasks(); renderWeekly(); }
function saveTasks() { localStorage.setItem('weeklyTasks', JSON.stringify(tasks)); }

// --- 5. تقويم الشهر ---
let curM = new Date().getMonth();
let curY = new Date().getFullYear();

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const firstDay = new Date(curY, curM, 1).getDay();
    const daysInMonth = new Date(curY, curM + 1, 0).getDate();

    document.getElementById('current-month-year').innerText = 
        new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(new Date(curY, curM));

    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        let key = `${curY}-${curM}-${d}`;
        let note = monthTasks[key] ? '<small>●</small>' : '';
        grid.innerHTML += `<div class="calendar-day" onclick="openModal('${key}')">${d} ${note}</div>`;
    }
}

let activeKey = "";
function openModal(key) {
    activeKey = key;
    document.getElementById('month-modal').style.display = 'flex';
    document.getElementById('modal-task-input').value = monthTasks[key] || "";
}
function closeModal() { document.getElementById('month-modal').style.display = 'none'; }
function saveMonthTask() {
    monthTasks[activeKey] = document.getElementById('modal-task-input').value;
    localStorage.setItem('monthTasks', JSON.stringify(monthTasks));
    closeModal();
    renderCalendar();
}
function changeMonth(s) { curM += s; if(curM>11){curM=0;curY++} if(curM<0){curM=11;curY--} renderCalendar(); }

// --- 6. الإحصائيات والترحيب ---
function updateStats() {
    let all = 0, done = 0;
    Object.values(tasks).forEach(d => d.forEach(t => { all++; if (t.done) done++; }));
    document.getElementById('total-tasks').innerText = all;
    document.getElementById('total-done').innerText = done;
    document.getElementById('total-perc').innerText = all ? Math.round((done / all) * 100) + '%' : '0%';
}

function addFocusPoints(p) {
    focusPoints += p;
    localStorage.setItem('focusPoints', focusPoints);
    displayHeaderData();
}

function displayHeaderData() {
    if (!userName) {
        userName = prompt("أهلاً بك! ما هو اسمك؟") || "مستخدم متألق";
        localStorage.setItem('userName', userName);
    }
    document.getElementById('user-greeting').innerText = `أهلاً بك، ${userName} ✨`;
    document.getElementById('f-points').innerText = `✨ نقاط التركيز: ${focusPoints}`;
    
    let badge = "🏅 مبتدئ";
    if(focusPoints > 100) badge = "🔥 مثابر";
    if(focusPoints > 500) badge = "👑 أسطورة";
    document.getElementById('user-badge').innerText = badge;
}

// --- 7. التحكم في الواجهة ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(v) {
    document.getElementById('weekly-view').style.display = v === 'weekly' ? 'block' : 'none';
    document.getElementById('monthly-view').style.display = v === 'monthly' ? 'block' : 'none';
    toggleSidebar();
}

// التشغيل عند التحميل
window.onload = () => {
    displayHeaderData();
    renderWeekly();
    renderCalendar();
    updateTimerDisplay();
};