"use strict";

///////////////////////////////

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const strtBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const taskList = document.getElementById("task-list");
const taskBtn = document.getElementById("add-task");
const taskTxt = document.getElementById("new-task");
const modes = document.querySelector(".modes");
const container = document.querySelector(".container");
const settingsBtn = document.querySelector(".settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsForm = document.getElementById("settings-form");
const settingsCancelBtn = document.getElementById("settings-cancel");
const focusInput = document.getElementById("focus-duration");
const shortInput = document.getElementById("short-break");
const longInput = document.getElementById("long-break");
const lapsInput = document.getElementById("laps-settings");
const completedTasksBtn = document.getElementById("show-completed");
const completedOverlay = document.getElementById("completed-overlay");
const completedCloseBtn = document.getElementById("completed-close");
const completedList = document.getElementById("completed-list");
const clearCompletedBtn = document.getElementById("clear-completed");
const laps = document.getElementById("laps");
const lapsText = document.getElementById("laps-text");
const longBreakAudio = new Audio("./longbreak.mp3");
const shortBreakAudio = new Audio("./shortBreak.mp3");

let previouslyFocusedElement = null;

const STORAGE_KEYS = {
  tasks: "pomodoroTasks",
  completed: "pomodoroCompletedTasks",
  settings: "pomodoroSettings",
};

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createTaskElement(task) {
  const listItem = document.createElement("li");
  listItem.dataset.id = task.id;
  const accessibleText = task.text.replace(/"/g, "'");

  const taskTextSpan = document.createElement("span");
  taskTextSpan.className = "task-text";
  taskTextSpan.textContent = task.text;

  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.className = "task-buttons";

  const completeButton = document.createElement("button");
  completeButton.className = "task-btn complete-btn";
  completeButton.title = "Completed";
  completeButton.textContent = "✔️";
  completeButton.type = "button";
  completeButton.setAttribute(
    "aria-label",
    `Mark ${accessibleText} as complete`
  );

  const editButton = document.createElement("button");
  editButton.className = "task-btn edit-btn";
  editButton.title = "Edit task";
  editButton.textContent = "✏️";
  editButton.type = "button";
  editButton.setAttribute("aria-label", `Edit ${accessibleText}`);

  const deleteButton = document.createElement("button");
  deleteButton.className = "task-btn delete-btn";
  deleteButton.title = "Delete task";
  deleteButton.textContent = "🗑️";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${accessibleText}`);

  buttonsWrapper.appendChild(completeButton);
  buttonsWrapper.appendChild(editButton);
  buttonsWrapper.appendChild(deleteButton);

  listItem.appendChild(taskTextSpan);
  listItem.appendChild(buttonsWrapper);

  return listItem;
}

function setControlsState(state) {
  if (state === "idle") {
    strtBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    resetBtn.classList.add("hidden");
    pauseBtn.textContent = "Pause";
  } else if (state === "running") {
    strtBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
  }
}

setControlsState("idle");

function syncModeButtonState(activeMode) {
  if (!modes) return;
  modes.querySelectorAll("button").forEach((button) => {
    const isActive = button.id === activeMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

syncModeButtonState("focus");

class app {
  constructor() {
    this.tasks = [];
    this.completedTasks = [];
    this.modes = null;
    this.themeRoot = document.body;
    this.totalLaps = 2;
    this.loaded = this.loadState();
    if (!this.loaded) this.init(25 * 60, 5 * 60, 15 * 60, 2);
    // this.mode = document.getElementById("focus");
    this.curMode = "focus";
    this.updateTheme();
  }

  init(workTime, shortbreak, longbreak, lap) {
    this.workTime = workTime;
    this.timeLeft = this.workTime;
    this.timerInterval = null;
    this.pause = null;
    this.curLap = 1;
    this.totalLaps = lap;
    this.modes = {
      focus: workTime,
      short: shortbreak,
      long: longbreak,
    };
    this.changeMode("focus");
    this.updateDisplay();
    setControlsState("idle");
    laps.classList.add("hidden");
  }

  controller() {
    if (this.curMode === "focus") {
      this.changeMode(
        `${this.curLap + 1 <= this.totalLaps ? "short" : "long"}`
      );
      shortBreakAudio.play();
      this.startTimer();
    } else if (this.curMode === "short" && this.curLap + 1 <= this.totalLaps) {
      this.curLap++;
      this.changeMode(`focus`);
      shortBreakAudio.play();
      this.startTimer();
    } else {
      longBreakAudio.play();
      this.init(
        this.workTime,
        this.modes.short,
        this.modes.long,
        this.totalLaps
      );
    }
  }

  updateDisplay() {
    const minutesLeft = Math.floor(this.timeLeft / 60);
    const secondsLeft = this.timeLeft % 60;
    minutesDisplay.textContent = String(minutesLeft).padStart(2, "0");
    secondsDisplay.textContent = String(secondsLeft).padStart(2, "0");
  }

  changeMode(mode) {
    console.log(`changing mode to ${mode}`);
    this.curMode = mode;
    syncModeButtonState(mode);
    this.timeLeft = this.modes[mode];
    this.updateTheme();
    this.updateDisplay();
  }

  updateTheme() {
    if (!this.themeRoot) return;
    this.themeRoot.classList.remove("focus-theme", "short-theme", "long-theme");
    const themeClass = `${this.curMode}-theme`;
    this.themeRoot.classList.add(themeClass);
  }

  saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(this.tasks));
    } catch (error) {
      alert(error);
      console.error("Failed to save tasks:", error);
    }
  }

  saveCompletedTasks() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.completed,
        JSON.stringify(this.completedTasks)
      );
    } catch (error) {
      alert(error);
      console.error("Failed to save completed tasks:", error);
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (error) {
      alert(error);
      console.error("Failed to save settings:", error);
    }
  }

  renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    this.tasks.forEach((task) => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  renderCompletedTasks() {
    if (!completedList) return;
    completedList.innerHTML = "";
    if (this.completedTasks.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "completed-empty";
      placeholder.textContent = "No completed tasks yet.";
      placeholder.setAttribute("role", "note");
      completedList.appendChild(placeholder);
      return;
    }

    this.completedTasks.forEach((task) => {
      const listItem = document.createElement("li");
      const safeText = task.text.replace(/"/g, "'");
      listItem.textContent = task.text;
      listItem.setAttribute("aria-label", `Completed task: ${safeText}`);
      completedList.appendChild(listItem);
    });
  }

  loadState() {
    const initialDomTasks = Array.from(
      taskList.querySelectorAll("li .task-text")
    )
      .map((span) => ({
        id: generateId(),
        text: span.textContent.trim(),
      }))
      .filter((task) => task.text.length > 0);

    let hasSavedTasks = false;
    let hasSavedSettings = false;

    try {
      const tasksRaw = localStorage.getItem(STORAGE_KEYS.tasks);
      if (tasksRaw) {
        hasSavedTasks = true;
        const parsedTasks = JSON.parse(tasksRaw);
        if (Array.isArray(parsedTasks)) {
          this.tasks = parsedTasks
            .filter((task) => {
              if (typeof task === "string") {
                return task.trim().length > 0;
              }
              return task && typeof task.text === "string";
            })
            .map((task) => {
              if (typeof task === "string") {
                return {
                  id: generateId(),
                  text: task.trim(),
                };
              }
              return {
                id: task.id || generateId(),
                text: task.text.trim(),
              };
            })
            .filter((task) => task.text.length > 0);
        }
      }

      if (!Array.isArray(this.tasks) || this.tasks.length === 0) {
        this.tasks = hasSavedTasks ? [] : initialDomTasks;
        if (!hasSavedTasks && this.tasks.length > 0) {
          this.saveTasks();
        }
      }

      const completedRaw = localStorage.getItem(STORAGE_KEYS.completed);

      if (completedRaw) {
        const parsedCompleted = JSON.parse(completedRaw);
        if (Array.isArray(parsedCompleted)) {
          this.completedTasks = parsedCompleted
            .filter((task) => {
              if (typeof task === "string") {
                return task.trim().length > 0;
              }
              return task && typeof task.text === "string";
            })
            .map((task) => {
              if (typeof task === "string") {
                return {
                  id: generateId(),
                  text: task.trim(),
                  completedAt: Date.now(),
                };
              }
              return {
                id: task.id || generateId(),
                text: task.text.trim(),
                completedAt:
                  typeof task.completedAt === "number"
                    ? task.completedAt
                    : Date.now(),
              };
            })
            .filter((task) => task.text.length > 0);
        }
      }

      if (!Array.isArray(this.completedTasks)) {
        this.completedTasks = [];
      }

      const settingsRaw = localStorage.getItem(STORAGE_KEYS.settings);
      if (settingsRaw) {
        hasSavedSettings = true;
        const parsedSettings = JSON.parse(settingsRaw);
        if (
          parsedSettings &&
          ["focus", "short", "long", "laps"].every(
            (key) =>
              typeof parsedSettings[key] === "number" && parsedSettings[key] > 0
          )
        ) {
          this.applySettings(parsedSettings);
        }
      }
    } catch (error) {
      alert(error);
      console.error("Failed to load saved state:", error);
      this.tasks = initialDomTasks;
      this.completedTasks = [];
    }

    this.renderTasks();
    this.renderCompletedTasks();
    return hasSavedSettings;
  }

  updateTaskText(taskId, newText) {
    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.text = newText;
    this.saveTasks();
  }

  applySettings({ focus, short, long, laps }) {
    const focusSeconds = focus * 60;
    const shortSeconds = short * 60;
    const longSeconds = long * 60;

    if (
      focusSeconds <= 0 ||
      shortSeconds <= 0 ||
      longSeconds <= 0 ||
      laps <= 0
    ) {
      throw new Error("Timer values must be greater than zero.");
    }

    this.saveSettings({ focus, short, long, laps });
    clearInterval(this.timerInterval);
    // this.init(focusSeconds, shortSeconds, longSeconds, laps);
    this.timerInterval = null;
    this.pause = null;
    this.totalLaps = laps;
    this.curLap = 1;
    this.workTime = focusSeconds;
    this.modes = {
      focus: focusSeconds,
      short: shortSeconds,
      long: longSeconds,
    };
    this.changeMode("focus");
    this.timeLeft = focusSeconds;
    this.updateDisplay();
    setControlsState("idle");
  }

  startTimer() {
    if (this.timerInterval !== null) return;
    setControlsState("running");
    laps.classList.remove("hidden");
    lapsText.textContent = `${this.curLap}/${this.totalLaps} Lap`;
    this.pause = false;
    pauseBtn.textContent = "Pause";
    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;

      this.updateDisplay();

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.controller();
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.pause === null) return;
    if (!this.pause) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      pauseBtn.textContent = "Resume";
      this.pause = true;
    } else {
      this.resumeTimer();
    }
  }

  resumeTimer() {
    this.pause = false;
    pauseBtn.textContent = "Pause";
    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;

      this.updateDisplay();

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.controller();
      }
    }, 1000);
  }

  resetTimer() {
    pauseBtn.textContent = "Pause";
    clearInterval(this.timerInterval);
    this.init(
      this.modes.focus,
      this.modes.short,
      this.modes.long,
      this.totalLaps
    );
  }

  addTask() {
    const value = taskTxt.value.trim();
    if (!value) return;
    if (value.length > 100) {
      taskTxt.value = "";
      alert("Only 100 characters are allowed");
      return;
    }

    const newTask = {
      id: generateId(),
      text: value,
    };

    this.tasks.unshift(newTask);
    this.saveTasks();
    this.renderTasks();
    taskTxt.value = "";
  }

  deleteTask(taskItem) {
    const taskId = taskItem.dataset.id;
    if (!taskId) {
      taskItem.remove();
      return;
    }

    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.saveTasks();
    this.renderTasks();
  }

  editTask(taskItem) {
    const taskTextSpan = taskItem.querySelector(".task-text");
    const taskId = taskItem.dataset.id;
    if (!taskTextSpan || !taskId) return;

    const currentText = taskTextSpan.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "task-edit-input";
    input.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      border: 2px solid var(--accent-color);
      border-radius: 4px;
      background: #2b2b2b;
      color: #fff;
      font-size: inherit;
      font-family: inherit;
    `;

    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText) {
        taskTextSpan.textContent = newText;
        this.updateTaskText(taskId, newText);
      }
      taskTextSpan.style.display = "";
      input.remove();
    };

    const cancelEdit = () => {
      taskTextSpan.style.display = "";
      input.remove();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      }
    });

    input.addEventListener("blur", saveEdit);

    taskTextSpan.style.display = "none";
    taskItem.insertBefore(input, taskTextSpan);
    input.focus();
    input.select();
  }

  completeTask(taskItem) {
    const taskId = taskItem.dataset.id;
    if (!taskId) return;

    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) return;

    const [completedTask] = this.tasks.splice(taskIndex, 1);
    this.saveTasks();

    if (completedTask && completedTask.text.trim()) {
      this.completedTasks.unshift({
        id: completedTask.id,
        text: completedTask.text.trim(),
        completedAt: Date.now(),
      });
      this.saveCompletedTasks();
    }

    this.renderTasks();
    this.renderCompletedTasks();
  }

  handleModeSelection(mode) {
    // if (!this.modes || !this.modes[mode]) return;
    if (this.curMode === mode) return;
    if (this.curMode === mode && this.timerInterval === null && !this.pause) {
      return;
    }

    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.pause = null;
    pauseBtn.textContent = "Pause";
    if (mode === "focus") {
      this.curLap = 1;
    }
    this.changeMode(mode);
    setControlsState("idle");
  }
}

const pomodoro = new app();
strtBtn.addEventListener("click", pomodoro.startTimer.bind(pomodoro));
pauseBtn.addEventListener("click", pomodoro.pauseTimer.bind(pomodoro));
resetBtn.addEventListener("click", pomodoro.resetTimer.bind(pomodoro));
taskBtn.addEventListener("click", pomodoro.addTask.bind(pomodoro));
taskTxt.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    pomodoro.addTask();
  }
});

// Event delegation for task buttons
taskList.addEventListener("click", function (e) {
  const taskItem = e.target.closest("li");
  if (!taskItem) return;

  if (e.target.classList.contains("delete-btn")) {
    pomodoro.deleteTask(taskItem);
  } else if (e.target.classList.contains("edit-btn")) {
    pomodoro.editTask(taskItem);
  } else if (e.target.classList.contains("complete-btn")) {
    pomodoro.completeTask(taskItem);
  }
});

modes.addEventListener("click", (event) => {
  const targetButton = event.target.closest("button");
  if (!targetButton) return;
  const mode = targetButton.id;
  if (!["focus", "short", "long"].includes(mode)) return;
  pomodoro.handleModeSelection(mode);
});

function applyOverlayBlur() {
  if (!container) return;
  container.classList.add("blurred");
  container.setAttribute("aria-hidden", "true");
}

function removeOverlayBlur() {
  if (
    settingsOverlay.classList.contains("hidden") &&
    completedOverlay.classList.contains("hidden")
  ) {
    if (container) {
      container.classList.remove("blurred");
      container.removeAttribute("aria-hidden");
    }
  }
}

function openSettingsModal() {
  focusInput.value = Math.round(pomodoro.modes.focus / 60);
  shortInput.value = Math.round(pomodoro.modes.short / 60);
  longInput.value = Math.round(pomodoro.modes.long / 60);
  lapsInput.value = Math.round(pomodoro.totalLaps);
  previouslyFocusedElement = document.activeElement;
  applyOverlayBlur();
  settingsOverlay.classList.remove("hidden");
  settingsOverlay.setAttribute("aria-hidden", "false");
  settingsBtn.setAttribute("aria-expanded", "true");
  focusInput.focus();
}

function closeSettingsModal() {
  settingsOverlay.classList.add("hidden");
  settingsOverlay.setAttribute("aria-hidden", "true");
  settingsBtn.setAttribute("aria-expanded", "false");
  settingsForm.reset();
  removeOverlayBlur();
  if (
    previouslyFocusedElement &&
    typeof previouslyFocusedElement.focus === "function"
  ) {
    previouslyFocusedElement.focus();
  }
  previouslyFocusedElement = null;
}

settingsBtn.addEventListener("click", openSettingsModal);

settingsCancelBtn.addEventListener("click", closeSettingsModal);

settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) {
    closeSettingsModal();
  }
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const focusMinutes = parseInt(focusInput.value, 10);
  const shortMinutes = parseInt(shortInput.value, 10);
  const longMinutes = parseInt(longInput.value, 10);
  const laps = parseInt(lapsInput.value, 10);

  if (
    Number.isNaN(focusMinutes) ||
    Number.isNaN(shortMinutes) ||
    Number.isNaN(longMinutes) ||
    Number.isNaN(laps) ||
    focusMinutes <= 0 ||
    shortMinutes <= 0 ||
    longMinutes <= 0 ||
    laps <= 0 ||
    focusMinutes > 120 ||
    shortMinutes > 20 ||
    longMinutes > 60 ||
    laps > 10
  ) {
    alert("Please enter valid numeric values for all timers.");
    return;
  }

  try {
    pomodoro.applySettings({
      focus: focusMinutes,
      short: shortMinutes,
      long: longMinutes,
      laps: laps,
    });
    closeSettingsModal();
  } catch (error) {
    alert(error.message);
  }
});

// Completed tasks modal logic

function openCompletedModal() {
  pomodoro.renderCompletedTasks();
  previouslyFocusedElement = document.activeElement;
  applyOverlayBlur();
  completedOverlay.classList.remove("hidden");
  completedOverlay.setAttribute("aria-hidden", "false");
  completedTasksBtn.setAttribute("aria-expanded", "true");
  completedCloseBtn.focus();
}

function clearCompletedTasks() {
  pomodoro.completedTasks = [];
  pomodoro.renderCompletedTasks();
  localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify([]));
}

function closeCompletedModal() {
  completedOverlay.classList.add("hidden");
  completedOverlay.setAttribute("aria-hidden", "true");
  completedTasksBtn.setAttribute("aria-expanded", "false");
  removeOverlayBlur();
  if (
    previouslyFocusedElement &&
    typeof previouslyFocusedElement.focus === "function"
  ) {
    previouslyFocusedElement.focus();
  }
  previouslyFocusedElement = null;
}

completedTasksBtn.addEventListener("click", openCompletedModal);
completedCloseBtn.addEventListener("click", closeCompletedModal);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);

completedOverlay.addEventListener("click", (event) => {
  if (event.target === completedOverlay) {
    closeCompletedModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!settingsOverlay.classList.contains("hidden")) {
      closeSettingsModal();
    } else if (!completedOverlay.classList.contains("hidden")) {
      closeCompletedModal();
    }
  }
});
