let sizeSlider, opacitySlider, colorPicker, bgcolor, filterPicker, symButton, clearButton;
let brushMode = '1'; 
let gkcount = 30;    
let startX, startY;
let symmetryOn = false;
let snBrush; 
let pg; // Allows for brush strokes to stay on canvas, had to be made because of the trazos brush.

// Trazos variables
let trazos = [];
let grosor = 5.0;
let contornos = false;

function setup() {
  createCanvas(900, 600);
  // Static lines will stay on canvas. Basically every brush other than the Trazo brush
  pg = createGraphics(900, 600);
  pg.background(255);
  background(255);

// Variables for the snake brush
  snBrush = new SnakeBrush(width / 2, height / 2, 20, brushShape);

  // UI
  // Brush size slider
  // the brush size label text
  createP("Brush Size").position(1030, 250).style('text-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  // how big the slider is
  sizeSlider = createSlider(1, 70, 10);
  // position of the slider itself, the style is the black shadow
  sizeSlider.position(1030, 300).style('box-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');

// brush opacity slider
  createP("Brush Opacity").position(1030, 350).style('text-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  opacitySlider = createSlider(0, 255, 255); 
  opacitySlider.position(1030, 400).style('box-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');

  // brush color picker
  createP("Brush Color").position(1030, 450).style('text-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  colorPicker = createColorPicker('#000000');
  colorPicker.position(1030, 500).style('box-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');

  // clear canvas color picker
  createP("Clear Canvas Color").position(1030, 550).style('text-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  bgcolor = createColorPicker('#ffffff');
  bgcolor.position(1030, 600).style('box-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');

// filter color picker
  createP("Filter Color").position(1030, 650).style('text-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  filterPicker = createColorPicker('#ff0000');
  filterPicker.position(1030, 700).style('box-shadow', '-3px -3px 5px black, 3px -3px 5px black, -3px 3px 5px black, 3px 3px 5px black');
  filterPicker.input(applyFilter);

  symButton = createButton("Symmetry: OFF");
  symButton.position(1030, 800).style('padding', '10px');
  symButton.mousePressed(toggleSymmetry);

  clearButton = createButton("Clear Canvas");
  clearButton.position(1030, 880).style('padding', '20px').style('font-size', '20px');
  clearButton.mousePressed(clearCanvas);
}


// Functions for brushed 6 and 7
//676767676767
function mousePressed() {
  startX = mouseX;
  startY = mouseY;
  
}

// function for trazo brush
function mouseDragged() {
  if (brushMode === '9') {
    let c = color(colorPicker.value());
    let balpha = opacitySlider.value();
    let finalColor = color(red(c), green(c), blue(c), balpha);
    
    trazos.push(new Trazo(mouseX, mouseY, sizeSlider.value(), finalColor));
    if (symmetryOn) {
      trazos.push(new Trazo(width - mouseX, mouseY, sizeSlider.value(), finalColor));
    }
  }
}



function draw() {
  // Draw the background color
  background(bgcolor.value());

  // Draw the static buffer 
  image(pg, 0, 0);

  // Wiggle moves the brushes to be more jagged
  if (keyIsPressed) {
    brushMode = key;
    if (key === ' ') wiggle();
    if (key === 'x') wiggle2();
  }

  //Draw Trazos 
  for (let i = trazos.length - 1; i >= 0; i--) {
    trazos[i].trace();
  }


  if (mouseIsPressed && brushMode !== '9') {
    drawChoice(mouseX, mouseY, pmouseX, pmouseY);
    if (symmetryOn) {
      drawChoice(width - mouseX, mouseY, width - pmouseX, pmouseY);
    }
  }
}

// start brush picker

function drawChoice(x, y, px, py) {
  let bsize = sizeSlider.value();
  let balpha = opacitySlider.value();
  let c = color(colorPicker.value());
  let bcolor = color(red(c), green(c), blue(c), balpha);
  let bg = bgcolor.value();

  // Buffer so brushes 1-8 stays on canvas
  pg.noStroke();
  pg.fill(bcolor);

  // default brush
  if (brushMode === '1') { 
    pg.stroke(bcolor);
    pg.strokeWeight(bsize);
    pg.line(x, y, px, py);
  } 

  // eraser
  else if (brushMode === '0' || brushMode === 'e') { 
    pg.stroke(bg);
    pg.strokeWeight(bsize);
    pg.line(x, y, px, py);
  } 

  // square brush
  else if (brushMode === '2') { 
    pg.rectMode(CENTER);
    pg.rect(x, y, random(5 - bsize, 20 + bsize));
  } 

  // circle brush
  else if (brushMode === '3') { 
    pg.circle(x, y, random(5 - bsize, 20 + bsize));
  }

  // spray brush
  else if (brushMode === '4') { 
    for (let i = 0; i < 50; i++) {
      pg.stroke(bcolor);
      pg.strokeWeight(2);
      pg.point(x + random(-bsize, bsize), y + random(-bsize, bsize));
    }
  } 

  // stringy brush copied over from Art 101 drawing app template
  else if (brushMode === '5') { 
    steveRanBrush(pg, bcolor, bsize, x, y, px, py);
  }

  // square generator
  else if (brushMode === '6') { 
    pg.stroke(bcolor);
    pg.strokeWeight(bsize);
    pg.noFill(); 
    pg.rectMode(CORNER);
    pg.rect(startX, startY, x - startX, y - startY);
  }

  // circle generator
  else if (brushMode === '7') { 
    pg.stroke(bcolor);
    pg.strokeWeight(bsize);
    pg.noFill();
    let radius = dist(startX, startY, x, y);
    pg.ellipse(startX, startY, radius * 2);
  }

  // snake brush copied from https://openprocessing.org/sketch/517166
  else if (brushMode === '8') {
    snBrush.wdth = bsize * 2.5; 
    snBrush.hght = bsize;       
    snBrush.dist = bsize * 0.8; 
    snBrush.setPos(x, y).updateSegmentsPos().draw(pg, bcolor);
  }

// trazo brush copied from https://openprocessing.org/sketch/1248
    if (brushMode === '9') {
    trazos.push(new Trazo(mouseX, mouseY, sizeSlider.value()));
    if (symmetryOn) {
      trazos.push(new Trazo(width - mouseX, mouseY, sizeSlider.value()));
    }
  }
}


// Snake brush
function SnakeBrush(x, y, segmentsCount, shapeDrawFn) {
  this.xPos = x; this.yPos = y; this.wdth = 25; this.hght = 10;
  this.segments = segmentsCount; this.posArr = []; this.dist = 8;
  this.strokeWgt = 1.5; this.shapeDrawFn = shapeDrawFn;
  for (var i = 0; i < this.segments; i++) { this.posArr[i] = createVector(x, y); }
  this.setPos = function (x, y) { this.xPos = x; this.yPos = y; return this; };
  this.updateSegmentsPos = function () {
    this.posArr[0] = createVector(this.xPos, this.yPos);
    for (var itr = 1; itr < this.segments; ++itr) {
      if (p5.Vector.dist(this.posArr[itr], this.posArr[itr - 1]) > this.dist) {
        var tmpVector = p5.Vector.sub(this.posArr[itr - 1], this.posArr[itr]).normalize().mult(this.dist);
        this.posArr[itr] = p5.Vector.sub(this.posArr[itr - 1], tmpVector);
      }
    }
    return this;
  };
  this.draw = function (target, bcolor) {
    for (var i = this.segments - 1; i > -1; --i) {
      target.push(); target.fill(bcolor); target.translate(this.posArr[i].x, this.posArr[i].y);
      if (i > 0) {
        target.rotate(atan2(this.posArr[i].y - this.posArr[i - 1].y, this.posArr[i].x - this.posArr[i - 1].x) + HALF_PI);
        target.stroke(0, 50); target.strokeWeight(this.strokeWgt);
        this.shapeDrawFn(target, -this.wdth / 2, 0, this.wdth, this.hght);
      }
      target.pop();
    }
  };
}



function brushShape(target, xCtr, yCtr, width, height) { target.rect(xCtr, yCtr, width, height); }


// symmetry brush toggle
function toggleSymmetry() { symmetryOn = !symmetryOn; symButton.html(symmetryOn ? "Symmetry: ON" : "Symmetry: OFF"); }


// clearing canvas function
function clearCanvas() { 
  pg.background(bgcolor.value()); 
  trazos = []; 
}


// filter brush
function applyFilter() { 
  let c = filterPicker.color(); 
  pg.noStroke(); 
  pg.fill(red(c), green(c), blue(c), 10); 
  pg.rect(0, 0, width, height); 
}

// Art 101 brush
function steveRanBrush(target, c, s, lx, ly, px, py) { 
  target.strokeWeight(random(1, s)); 
  target.stroke(c); 
  target.line(lx, ly, px, py); 
}

// --- TRAZOS CLASS (Herbert Spencer) ---
class Trazo {
  constructor(x, y, brushGrosor, bcolor) {
    this.largo = round(random(20, 100));
    this.pos = []; this.r = []; this.ang = [];
    this.bcolor = bcolor;
    this.drawing = true; this.seed = round(random(3000));
    this.count = 1;
    this.pos[0] = createVector(x, y);
    this.ang[0] = random(TWO_PI);
    this.r[0] = 0.1;
    for (let i = 1; i < this.largo; i++) {
      noiseSeed(this.seed);
      let fac = map(i, 1, this.largo, 0.3, PI - 0.3);
      this.ang[i] = this.ang[i - 1] + ((noise(i / 10.0) - 0.5) * 0.7);
      this.r[i] = (this.r[i - 1] + (noise(i / 50) - 0.5) * brushGrosor) * sin(fac) + 0.1;
      let newX = this.pos[i - 1].x + (cos(this.ang[i]) * 6);
      let newY = this.pos[i - 1].y + (sin(this.ang[i]) * 6);
      this.pos[i] = createVector(newX, newY);
    }
  }
trace() {
    if (contornos) { 
      stroke(this.bcolor); // Use stored color
      noFill(); 
    } 
    else { 
      fill(this.bcolor); // Use stored color
      noStroke(); 
    }
    let limit = this.drawing ? this.count : this.largo;
    beginShape();
    curveVertex(this.pos[0].x, this.pos[0].y);
    for (let i = 1; i < limit; i++) {
      let x = this.pos[i].x + (cos(this.ang[i] - HALF_PI) * this.r[i]);
      let y = this.pos[i].y + (sin(this.ang[i] - HALF_PI) * this.r[i]);
      curveVertex(x, y);
    }
    curveVertex(this.pos[limit - 1].x, this.pos[limit - 1].y);
    for (let i = limit - 2; i > 1; i--) {
      let x = this.pos[i].x + (cos(this.ang[i] + HALF_PI) * this.r[i]);
      let y = this.pos[i].y + (sin(this.ang[i] + HALF_PI) * this.r[i]);
      curveVertex(x, y);
    }
    curveVertex(this.pos[0].x, this.pos[0].y);
    endShape(CLOSE);
    if (this.drawing) {
      this.count++;
      if (this.count === this.largo) this.drawing = false;
    }
  }
}

function wiggle() {
  for (let t of trazos) {
    noiseSeed(t.seed);
    for (let j = 0; j < t.largo; j++) {
      t.r[j] += (noise(millis() / 10.0) - 0.5) * 0.5;
      t.pos[j].x += noise((millis() + t.seed) / 50.0) - 0.5;
      t.pos[j].y += noise((millis() + t.seed * 2) / 100.0) - 0.5;
    }
  }
}

function wiggle2() {
  for (let t of trazos) {
    noiseSeed(t.seed);
    for (let j = 0; j < t.largo; j++) {
      t.pos[j].x += noise((t.pos[j].x) / 50.0) - 0.5;
      t.pos[j].y += noise((t.pos[j].y) / 50.0) - 0.5;
    }
  }
}

function keyPressed() {
  if (key === 'h') contornos = !contornos;
  else if (key === 's')   // Save the canvas to 'myCanvas.jpg'.
  saveCanvas('myCanvas.jpg');

  describe('A white square.');

}

