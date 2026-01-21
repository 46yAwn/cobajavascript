/* ===============================
   INPUT HANDLER
================================ */
class Input {
  constructor() {
    this.throttle = 0;
    this.steer = 0;

    window.addEventListener("keydown", e => this.onKey(e, true));
    window.addEventListener("keyup", e => this.onKey(e, false));
  }

  onKey(e, down) {
    if (e.key === "w") this.throttle = down ? 1 : 0;
    if (e.key === "a") this.steer = down ? -1 : 0;
    if (e.key === "d") this.steer = down ? 1 : 0;
  }
}

/* ===============================
   ENGINE
================================ */
class Engine {
  constructor() {
    this.rpm = 1000;
    this.maxRPM = 7000;
    this.idleRPM = 900;
  }

  torqueCurve(rpm) {
    // Kurva torsi parabola sederhana
    return Math.max(0,
      -0.000002 * (rpm - 4000) ** 2 + 280
    );
  }
}

/* ===============================
   TRANSMISSION
================================ */
class Transmission {
  constructor() {
    this.gears = {
      R: -3.2,
      1: 3.5,
      2: 2.2,
      3: 1.5,
      4: 1.1,
      5: 0.9,
      N: 0
    };
    this.order = ["R", "N", "1", "2", "3", "4", "5"];
    this.currentIndex = 1;
  }

  get gear() {
    return this.order[this.currentIndex];
  }

  ratio() {
    return this.gears[this.gear];
  }

  shiftUp() {
    if (this.currentIndex < this.order.length - 1)
      this.currentIndex++;
  }

  shiftDown() {
    if (this.currentIndex > 0)
      this.currentIndex--;
  }
}

/* ===============================
   VEHICLE PHYSICS
================================ */
class Vehicle {
  constructor() {
    this.engine = new Engine();
    this.transmission = new Transmission();

    this.speed = 0;          // m/s
    this.heading = 0;
    this.angularVelocity = 0;

    this.mass = 1200;
    this.drag = 0.98;
    this.lateralGrip = 1.0;
  }

  update(input, dt) {
    const ratio = this.transmission.ratio();
    const torque = this.engine.torqueCurve(this.engine.rpm);
    const driveForce = torque * ratio * input.throttle;

    // Inertia
    this.speed += (driveForce / this.mass) * dt;
    this.speed *= this.drag;

    // RPM sync
    if (ratio !== 0) {
      this.engine.rpm = Math.max(
        this.engine.idleRPM,
        Math.min(this.engine.maxRPM,
          Math.abs(this.speed * ratio * 60)
        )
      );
    }

    // Steering & drifting
    const lateralForce = Math.abs(this.speed * input.steer);
    const slip = lateralForce > this.lateralGrip * 15;

    if (slip) {
      this.heading += input.steer * this.speed * 0.04;
    } else {
      this.heading += input.steer * this.speed * 0.02;
    }
  }
}

/* ===============================
   DASHBOARD UI
================================ */
class Dashboard {
  constructor() {
    this.rpmNeedle = document.getElementById("rpmNeedle");
    this.speedNeedle = document.getElementById("speedNeedle");
    this.gearDisplay = document.getElementById("gearDisplay");
  }

  update(vehicle) {
    const rpmAngle = vehicle.engine.rpm / 7000 * 180 - 90;
    const speedAngle = vehicle.speed * 4 - 90;

    this.rpmNeedle.style.transform = `rotate(${rpmAngle}deg)`;
    this.speedNeedle.style.transform = `rotate(${speedAngle}deg)`;
    this.gearDisplay.textContent = vehicle.transmission.gear;
  }
}

/* ===============================
   MAIN LOOP
================================ */
const canvas = document.getElementById("simCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const input = new Input();
const vehicle = new Vehicle();
const dashboard = new Dashboard();

window.addEventListener("keydown", e => {
  if (e.key === "q") vehicle.transmission.shiftDown();
  if (e.key === "e") vehicle.transmission.shiftUp();
});

let last = performance.now();

function loop(now) {
  const dt = (now - last) / 1000;
  last = now;

  vehicle.update(input, dt);
  dashboard.update(vehicle);

  requestAnimationFrame(loop);
}

loop(last);
