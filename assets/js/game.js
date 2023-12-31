const FPS = 30;
const SHIP_SIZE = 30; //ship size in pixels
const TURN_SPEED = 360; //turn speed in degrees per second
const FRICTION = 0.6; //friction in space //thrust slowing down
const BASE_THRUST = 5; //acceleration
const ROIDS_NUM = 15; //number of asteriods
const ROIDS_JAG = 0.7; //rough edges of astroid 0 = none 1 = lot
const ROIDS_SIZE = 100; //starting size
const ROIDS_SPD = 20;
const ROIDS_VERT = 7; //avg num of vertices
const SHOW_BOUNDING = false; //show the collusion in debugging
const SHIP_BLINK_DUR = 0.5; // duration in seconds of a single blink during ship's invisibility
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion in seconds
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const LASER_MAX = 10; //maximum lasers on the screen
const LASER_SPD = 500; //speed of lasers

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

//setup game loop
window.addEventListener("resize", resizeCanvas, false);
function resizeCanvas() {
  canv.width = window.innerWidth;
  canv.height = window.innerHeight;
  /**
   * Your drawings need to be inside this function otherwise they will be reset when
   * you resize the browser window and the canvas goes will be cleared.
   */
  update();
}

setInterval(resizeCanvas, 1000 / FPS);

// set up the spaceship object
var ship = newShip();

function newShip() {
  return {
    x: window.innerWidth / 2,
    y: (3 * window.innerHeight) / 5,
    a: (90 / 180) * Math.PI, // convert to radians
    r: SHIP_SIZE / 2,
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    explodeTime: 0,
    rot: 0,
    thrusting: false,
    breaking: false,
    thrust: {
      x: 0,
      y: 0,
    },
    lasers: [],
    gunActive: false,
  };
}
var roids = [];
createAstroidBelt();

//create astroid belt
function createAstroidBelt() {
  roids = [];
  var x, y;
  for (var i = 0; i < ROIDS_NUM; i++) {
    // random asteroid location (not touching spaceship)
    do {
      x = Math.floor(Math.random() * window.innerWidth);
      y = Math.floor(Math.random() * window.innerHeight);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//draw the astroids
function drawAstroids() {
  var x, y, r, a, vert, offset;
  for (var i = 0; i < roids.length; i++) {
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;
    //get astroid propeties
    x = roids[i].x;
    y = roids[i].y;
    r = roids[i].r;
    a = roids[i].a;
    offset = roids[i].offset;
    vert = roids[i].vert;
    //draw the path
    ctx.beginPath();
    ctx.moveTo(x + r * offset[0] * Math.cos(a), y + r * Math.sin(a));
    //draw the polygon
    for (var j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offset[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offset[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "lime";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }

    // move the asteroid
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    // handle asteroid edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }
}

function newAsteroid(x, y, r) {
  var roid = {
    x: x,
    y: y,
    xv: ((Math.random() * ROIDS_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    yv: ((Math.random() * ROIDS_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2,
    vert: Math.floor(Math.random() * ROIDS_VERT + 1 + ROIDS_VERT / 2), //vertices to a roid
    offset: [],
  };
  //create the offset array for vertices
  for (var i = 0; i < roid.vert; i++) {
    roid.offset.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
  }
  return roid;
}

//setup event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function keyDown(/** {KeyboardEvent} */ ev) {
  ev.preventDefault();
  // console.log(ev.keyCode);
  switch (ev.keyCode) {
    case 32: //space
      shootLaser();
      break;
    case 37: //left arrow
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    case 38: //up arrow
      ship.thrusting = true;
      break;
    case 39: //right arrow
      ship.rot = -((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    case 40:
      ship.breaking = true;
      break;
  }
}

function keyUp(/** {KeyboardEvent} */ ev) {
  ev.preventDefault();
  // console.log(ev.keyCode);
  switch (ev.keyCode) {
    case 32: //space
      ship.gunActive = false;
      break;
    case 37: //left arrow
      ship.rot = 0;
      break;
    case 38: //up arrow
      ship.thrusting = false;
      break;
    case 39: //right arrow
      ship.rot = 0;
      break;
    case 40:
      ship.breaking = false;
      break;
  }
}

function thruster() {
  //draw ship
  (ctx.strokeStyle = "white"), (ctx.lineWidth = SHIP_SIZE / 20);
  ctx.beginPath();
  ctx.moveTo(
    //nose
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    //rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    //rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();
}

function drawShip() {
  //draw ship
  (ctx.strokeStyle = "white"), (ctx.lineWidth = SHIP_SIZE / 20);
  ctx.beginPath();
  ctx.moveTo(
    //nose
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    //rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    //rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();

  if (SHOW_BOUNDING) {
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  //secondary triange for effects
  (ctx.strokeStyle = "white"), (ctx.lineWidth = SHIP_SIZE / 20);
  ctx.beginPath();
  ctx.moveTo(
    //nose
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    //rear left
    ship.x - ship.r * ((1 / 5000) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((1 / 5000) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    //rear right
    ship.x - ship.r * ((1 / 5000) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((1 / 5000) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();
}
function drawExplotion() {
  // draw the explosion (concentric circles of different colours)
  ctx.fillStyle = "darkred";
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
  ctx.fill();
}
function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}
function drawThruster() {
  //draw trust
  (ctx.fillStyle = "red"),
    (ctx.strokeStyle = "yellow"),
    (ctx.lineWidth = SHIP_SIZE / 10);
  ctx.beginPath();
  ctx.moveTo(
    //nose
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    //rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    //rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();

  //actual thruster
  (ctx.fillStyle = "green"),
    (ctx.strokeStyle = "yellow"),
    (ctx.lineWidth = SHIP_SIZE / 20);
  ctx.beginPath();
  ctx.moveTo(
    //move to rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
  );
  ctx.lineTo(
    //rear left
    ship.x - ship.r * ((6 / 3) * Math.cos(ship.a)),
    ship.y + ship.r * ((6 / 3) * Math.sin(ship.a))
  );
  ctx.lineTo(
    //rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBlinkShip() {
  ctx.strokeStyle = "red";
  ctx.fillStyle = "orange";
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    // rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    // rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function shootLaser() {
  //create the laser object
  if (ship.gunActive == false && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: -(LASER_SPD * Math.sin(ship.a)) / FPS,
    });
    //   console.log(ship.lasers);
  }

  //prevent further shooting
  ship.gunActive = true;
}

function drawLasers() {
  for (var i = 0; i < ship.lasers.length; i++) {
    ctx.fillStyle = "salmon";
    ctx.beginPath();
    ctx.arc(
      ship.lasers[i].x,
      ship.lasers[i].y,
      SHIP_SIZE / 15,
      0,
      Math.PI * 2,
      false
    );
    ctx.fill();
  }
}

function moveLasers() {
  for (var i = 0; i < ship.lasers.length; i++) {
    //handle edge of screen

    if (
      ship.lasers[i].x < 0 ||
      ship.lasers[i].x > canv.width ||
      ship.lasers[i].y < 0 ||
      ship.lasers[i].y > canv.height
    ) {
      ship.lasers.splice(i, 1); //design decision was made. dont want to mirror the lasers
      continue;
    }

    ship.lasers[i].x += ship.lasers[i].xv;
    ship.lasers[i].y += ship.lasers[i].yv;
  }
}

function destroyRoids() {
  var ax, ay, ar, lx, ly;
  for (var i = roids.length - 1; i >= 0; i--) {
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    for (j = ship.lasers.length - 1; j >= 0; j--) {
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      if (distBetweenPoints(ax, ay, lx, ly) < ar) {
        ship.lasers.splice(j, 1);
        //   roids.splice(i, 1);
        destroyAstroidsCompletely(i);
        break;
      }
    }
  }
}
function destroyAstroidsCompletely(i) {
  var x, y, r;
  x = roids[i].x;
  y = roids[i].y;
  r = roids[i].r;

  if (r == Math.ceil(ROIDS_SIZE / 2)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
  } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
  }
  roids.splice(i, 1);
}
function update() {
  var blinkOn = ship.blinkNum % 2 != 0;
  var exploding = ship.explodeTime > 0;
  //draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canv.width, canv.height);

  //thrusting
  if (ship.thrusting && !exploding) {
    ship.thrust.x += (BASE_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (BASE_THRUST * Math.sin(ship.a)) / FPS;

    //draw the thruster
    drawThruster();
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }

  if (ship.breaking) {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }
  //draw ship

  // check for asteroid collisions (when not exploding)
  if (!exploding) {
    // only check when not blinking
    drawShip();

    if (blinkOn) {
      drawBlinkShip();
    }

    // handle blinking
    if (ship.blinkNum > 0) {
      // reduce the blink time
      ship.blinkTime--;

      // reduce the blink num
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
      }
    }

    if (ship.blinkNum == 0) {
      for (var i = 0; i < roids.length; i++) {
        if (
          distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
          ship.r + roids[i].r
        ) {
          explodeShip();
          destroyAstroidsCompletely(i);
          drawExplotion();
          break;
        }
      }
    } else {
      drawShip();
    }

    // rotate the ship
    ship.a += ship.rot;
    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    // reduce the explode time
    ship.explodeTime--;

    // reset the ship after the explosion has finished
    if (ship.explodeTime == 0) {
      ship = newShip();
    }
  }

  //destroy astroids with lasers
  destroyRoids();

  //lasers
  drawLasers();

  //move the lasers
  moveLasers();

  //astroids
  drawAstroids();
  if (!exploding) {
    ship.a += ship.rot;

    //move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  }
  //rotate ship

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  }
}
