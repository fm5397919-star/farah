// 1. إعدادات الأصوات
const workEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const breakEndSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

// 2. طلب إذن الإشعارات عند التحميل
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

// 3. المتغيرات الأساسية
let timerId = null;
let isWorkMode = true;
let workTime = 25;
let breakTime = 5;
let timeLeft = workTime * 60;

const timerDisplay = document.getElementById('timer-display');
const pomoLabel = document.getElementById('pomo-label');

// 4. دالة التنبيه المشتركة (صوت + إشعار + رسالة)
function sendAlert(title, message, type) {
    // تشغيل الصوت حسب النوع
    if (type === 'work') {
        workEndSound.play().catch(e => console.log("الصوت يحتاج تفاعل أولاً"));
    } else {
        breakEndSound.play().catch(e => console.log("الصوت يحتاج تفاعل أولاً"));
    }

    // إرسال إشعار للنظام
    if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: 'logo.png' });
    }

    // تنبيه للمستخدم
    alert(message);
}

// 5. تحديث الشاشة
function updateDisplay() {
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    timerDisplay.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 6. التحكم بالوقت (ابدأ)
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
                sendAlert("انتهى وقت العمل! 🎯", "خذ استراحة قصيرة الآن.", 'work');
                isWorkMode = false;
                timeLeft = breakTime * 60;
                pomoLabel.innerText = "☕ وقت الراحة";
                addFocusPoints(10);
            } else {
                sendAlert("انتهت الراحة! 💪", "عد للتركيز والعمل.", 'break');
                isWorkMode = true;
                timeLeft = workTime * 60;
                pomoLabel.innerText = "🎯 وقت التركيز";
            }
            updateDisplay();
        }
    }, 1000);
}

// 7. توقف وإعادة
function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
}

function resetTimer() {
    pauseTimer();
    workTime = parseInt(document.getElementById('work-input').value) || 25;
    breakTime = parseInt(document.getElementById('break-input').value) || 5;
    isWorkMode = true;
    timeLeft = workTime * 60;
    pomoLabel.innerText = "🎯 وقت التركيز";
    updateDisplay();
}

// 8. نظام النقاط
function addFocusPoints(pts) {
    let currentPoints = parseInt(localStorage.getItem('focusPoints')) || 0;
    currentPoints += pts;
    localStorage.setItem('focusPoints', currentPoints);
    const pointsElement = document.getElementById('f-points');
    if(pointsElement) pointsElement.innerText = `✨ نقاط التركيز: ${currentPoints}`;
}

// التشغيل الأولي
updateDisplay();