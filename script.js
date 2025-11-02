"use strict";

///////////////////////////////

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const strtBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const modes = document.querySelector(".modes");

class app {
  constructor(workTime) {
    this.init(workTime * 3);
    this.mode = document.getElementById("focus");
    this.curMode = "focus";
  }

  init(workTime) {
    this.workTime = workTime;
    this.timeLeft = this.workTime;
    this.timerIntervel = null;
    this.pause = null;
    this.curLap = 0;
    this.totalLaps = 2;
    this.modes = {
      focus: this.workTime,
      short: 5,
      long: 10,
    };
    this.updateDisplay();
  }

  controller() {
    if (this.curMode === "focus") {
      this.curLap++;
      this.changeMode(`${this.curLap < this.totalLaps ? "short" : "long"}`);
      this.startTimer();
    } else if (this.curMode === "short") {
      this.changeMode(`focus`);
      this.startTimer();
    } else {
      this.changeMode(`focus`);
      this.init(this.workTime);
    }
  }

  updateDisplay() {
    const minutesLeft = Math.floor(this.timeLeft / 60);
    const secondsLeft = this.timeLeft % 60;
    minutesDisplay.textContent = String(minutesLeft).padStart(2, "0");
    secondsDisplay.textContent = String(secondsLeft).padStart(2, "0");
  }
  updateTimer(work) {
    this.init(work);
    this.updateDisplay();
  }
  changeMode(mode) {
    console.log(`changing mode to ${mode}`);
    this.mode.classList.remove("active");
    this.curMode = mode;
    this.mode = document.getElementById(`${mode}`);
    this.mode.classList.add("active");
    this.timeLeft = this.modes[mode];
  }

  startTimer() {
    if (this.timerIntervel !== null) return;
    console.log("start");
    this.pause = false;
    pauseBtn.textContent = "Pause";
    this.timerIntervel = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft < 0) {
        clearInterval(this.timerIntervel);
        this.timerIntervel = null;
        return;
      }

      this.updateDisplay();

      if (this.timeLeft === 0) {
        clearInterval(this.timerIntervel);
        this.timerIntervel = null;
        this.controller();
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.pause === null) return;
    if (!this.pause) {
      console.log("paused");
      clearInterval(this.timerIntervel);
      this.timerIntervel = null;
      pauseBtn.textContent = "Resume";
      this.pause = true;
    } else {
      console.log("Resumed");
      this.startTimer();
    }
  }

  resetTimer() {
    if (this.timerIntervel !== null || this.pause === true) {
      console.log("reset");
      pauseBtn.textContent = "Pause";
      clearInterval(this.timerIntervel);
      this.changeMode("focus");
      this.init(this.workTime);
    }
  }
}

const pomodoro = new app(1);
strtBtn.addEventListener("click", pomodoro.startTimer.bind(pomodoro));
pauseBtn.addEventListener("click", pomodoro.pauseTimer.bind(pomodoro));
resetBtn.addEventListener("click", pomodoro.resetTimer.bind(pomodoro));
