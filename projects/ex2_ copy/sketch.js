// ============================================================
// COLORS
// ============================================================

let C = {
  darkBrown: '#170b05',
  cream: '#fff2d8',
  orange: '#ff6b1a',
  blue: '#0094ff',
  green: '#00d47e',
  red: '#ff3055',
  offWhite: '#fff8e8',
  panelPink: '#ffd1c9',
  grid: '#5b2b16'
};


// ============================================================
// MAIN VARIABLES
// ============================================================

let mgr;

let paperImg = null;
let woodImg = null;
let panelWoodImg = null;

let backSound = null;
let nextSound = null;
let saveSound = null;
let sliderSound = null;
let startSound = null;
let toggleSound = null;
let uploadSound = null;

let lastSoundTimes = {};

let uploadedImg = null;
let fileInput;

let filteredCanvas;
let filteredFinalCanvas;
let originalFinalCanvas;
let finalOutput;

let controls = [];

let originalMix;
let editedMix;

let uploadBtn;
let startBtn;
let helpBtn;
let backBtn;
let nextBtn;
let saveBtn;

// Re render filters only when something changes and not every frame, reduces lag
let needsFilterUpdate = false;
let lastFilterUpdate = 0;
let filterDelay = 300;
let isSaving = false;

// cached dither, reduces lag
let cachedDitherCanvas = null;
let ditherDirty = true;


// ============================================================
// SETUP
// ============================================================

function setup() {
  createCanvas(1100, 700);
  pixelDensity(1);

  loadAssets();

  // these are the offscreen buffers for the filters
  filteredCanvas = createGraphics(650, 460);
  filteredCanvas.pixelDensity(1);

  filteredFinalCanvas = createGraphics(580, 470);
  filteredFinalCanvas.pixelDensity(1);

  originalFinalCanvas = createGraphics(580, 470);
  originalFinalCanvas.pixelDensity(1);

  finalOutput = createGraphics(580, 470);
  finalOutput.pixelDensity(1);

  fileInput = createFileInput(handleFile);
  fileInput.hide();

  makeControls();

  // scene manager
  if (typeof SceneManager !== "undefined") {
    mgr = new SceneManager();
  } else {
    mgr = new SimpleSceneManager();
  }

  mgr.addScene(IntroScene);
  mgr.addScene(EditScene);
  mgr.addScene(FinalScene);
  mgr.addScene(HelpScene);
  mgr.showScene(IntroScene);
}


// ============================================================
// DRAW
// ============================================================

function draw() {
  mgr.draw();

  // only update filters when something changed AND enough time passed
  if (needsFilterUpdate == true && millis() - lastFilterUpdate > filterDelay) {
    ditherDirty = true;
    updateFilteredImages();
    needsFilterUpdate = false;
    lastFilterUpdate = millis();
  }
}


function loadAssets() {
  loadImage("assets/paper.png",
    function(img) {
      paperImg = img;
    },
    function() {
      paperImg = null;
    }
  );

  loadImage("assets/wood.png",
    function(img) {
      woodImg = img;
    },
    function() {
      woodImg = null;
    }
  );

  loadImage("assets/woodg.png",
    function(img) {
      panelWoodImg = img;
    },
    function() {
      panelWoodImg = null;
    }
  );

  backSound   = loadSoundNoCrash("assets/back.mp3");
  nextSound   = loadSoundNoCrash("assets/next.mp3");
  saveSound   = loadSoundNoCrash("assets/save.mp3");
  sliderSound = loadSoundNoCrash("assets/slider.mp3");
  startSound  = loadSoundNoCrash("assets/start.mp3");
  toggleSound = loadSoundNoCrash("assets/toggle.mp3");
  uploadSound = loadSoundNoCrash("assets/upload.mp3");
}

function loadSoundNoCrash(path) {
  if (typeof loadSound === "undefined") {
    return null;
  }

  let snd = null;

  try {
    snd = loadSound(
      path,
      function() {},
      function() {
        snd = null;
      }
    );
  } catch (e) {
    snd = null;
  }

  return snd;
}


// ============================================================
// SIMPLE SCENE MANAGER FALLBACK
// if the real SceneManager library isnt loaded this works instead
// ============================================================

function SimpleSceneManager() {
  this.scene = null;

  this.addScene = function(sceneName) {
    // dont need to do anything here
  };

  this.showScene = function(sceneName) {
    this.scene = new sceneName();

    if (this.scene.enter) {
      this.scene.enter();
    }
  };

  this.draw = function() {
    if (this.scene && this.scene.draw) {
      this.scene.draw();
    }
  };

  this.mousePressed = function() {
    if (this.scene && this.scene.mousePressed) {
      this.scene.mousePressed();
    }
  };

  this.mouseDragged = function() {
    if (this.scene && this.scene.mouseDragged) {
      this.scene.mouseDragged();
    }
  };

  this.mouseReleased = function() {
    if (this.scene && this.scene.mouseReleased) {
      this.scene.mouseReleased();
    }
  };

  this.keyPressed = function() {
    if (this.scene && this.scene.keyPressed) {
      this.scene.keyPressed();
    }
  };
}


// ============================================================
// GLOBAL EVENTS
// ============================================================

function mousePressed() {
  userStartAudio();

  if (mgr != null && mgr.mousePressed) {
    mgr.mousePressed();
  }
}

function mouseDragged() {
  if (mgr != null && mgr.mouseDragged) {
    mgr.mouseDragged();
  }
}

function mouseReleased() {
  if (mgr != null && mgr.mouseReleased) {
    mgr.mouseReleased();
  }
}

function keyPressed() {
  if (mgr != null && mgr.keyPressed) {
    mgr.keyPressed();
  }
}


// ============================================================
// CONTROLS
// ============================================================

function makeControls() {
  controls = [];

  let x = 18;
  let y = 96;
  let gap = 56; // was 53, made it bigger so toggles dont overlap

  controls.push(makeControl("Red Channel",   "red",      x, y + gap * 0,  1.0, false));
  controls.push(makeControl("Blue Channel",  "blue",     x, y + gap * 1,  1.0, false));
  controls.push(makeControl("Green Channel", "green",    x, y + gap * 2,  1.0, false));

  controls.push(makeControl("Mono Grain",    "grain",    x, y + gap * 3,  0.45, false));
  controls.push(makeControl("Riso Dither",   "dither",   x, y + gap * 4,  0.45, false));
  controls.push(makeControl("Riso Halftone", "halftone", x, y + gap * 5,  0.35, false));

  controls.push(makeControl("FIP Glitch",    "glitch",   x, y + gap * 6,  0.35, false));
  controls.push(makeControl("FIP Bloom",     "bloom",    x, y + gap * 7,  0.35, false));
  controls.push(makeControl("FIP Contrast",  "contrast", x, y + gap * 8,  0.45, false));
  controls.push(makeControl("FIP Dilate",    "dilate",   x, y + gap * 9,  0.35, false));
  controls.push(makeControl("FIP Kuwahara",  "kuwahara", x, y + gap * 10, 0.45, false));

  // moved these down for scene 3
  originalMix = {
    label: "Original",
    x: 895,
    y: 175,
    w: 150,
    val: 1,
    dragging: false,
    on: true
  };

  editedMix = {
    label: "Edited",
    x: 895,
    y: 275,
    w: 150,
    val: 1,
    dragging: false,
    on: true
  };
}

function makeControl(label, id, x, y, val, on) {
  return {
    label: label,
    id: id,
    toggleX: x,
    toggleY: y,
    sliderX: x + 52,
    sliderY: y,
    sliderW: 190,
    val: val,
    on: on,
    dragging: false
  };
}


// ============================================================
// FILE UPLOAD
// ============================================================

function handleFile(file) {
  if (file.type == "image") {
    uploadedImg = loadImage(file.data, function() {
      needsFilterUpdate = true;
      ditherDirty = true;
      playAnySound(uploadSound, 600, 80, "upload");
      mgr.showScene(EditScene);
    });
  }
}


// ============================================================
// SCENE 1 - INTRO
// ============================================================

function IntroScene() {
  this.draw = function() {
    drawStudioBackground();

    drawScreenFrame(260, 80, 580, 460);

    fill(C.darkBrown);
    noStroke();
    textAlign(CENTER);
    textStyle(BOLD);
    textSize(48);
    text("Screen Printing", width / 2, 190);
    text("Studio", width / 2, 245);

    textStyle(NORMAL);
    textSize(18);
    text("Upload an image to start", width / 2, 305);

    if (uploadedImg != null) {
      fill(C.green);
      text("Image uploaded. Press START PRINTING.", width / 2, 335);
    } else {
      fill(C.red);
      text("Choose an image first.", width / 2, 335);
    }

    uploadBtn = { x: 425, y: 380, w: 250, h: 42 };
    startBtn  = { x: 425, y: 435, w: 250, h: 42 };
    helpBtn   = { x: 975, y: 25,  w: 90,  h: 35 };

    drawButton(uploadBtn, "UPLOAD IMAGE");

    if (uploadedImg != null) {
      drawButton(startBtn, "START PRINTING");
    } else {
      drawDisabledButton(startBtn, "START PRINTING");
    }

    drawSmallButton(helpBtn, "HELP");

    fill(C.darkBrown);
    textSize(14);
    textAlign(CENTER);
    text("Keys: 1 Upload | 2 Edit | 3 Final | 4 Help | S Save", width / 2, height - 25);
  };

  this.mousePressed = function() {
    if (mouseInRect(uploadBtn)) {
      fileInput.elt.click();
      playAnySound(uploadSound, 600, 80, "upload");
    }

    if (mouseInRect(startBtn)) {
      if (uploadedImg != null) {
        needsFilterUpdate = true;
        ditherDirty = true;
        playAnySound(startSound, 500, 100, "start");
        mgr.showScene(EditScene);
      } else {
        playAnySound(toggleSound, 90, 120, "toggle");
      }
    }

    if (mouseInRect(helpBtn)) {
      playAnySound(toggleSound, 700, 80, "toggle");
      mgr.showScene(HelpScene);
    }
  };

  this.keyPressed = function() {
    handleSceneKeys();
  };
}


// ============================================================
// SCENE 2 - EDIT
// ============================================================

function EditScene() {
  this.draw = function() {
    drawStudioBackground();
    drawLeftPanel();

    drawScreenFrame(315, 50, 760, 575);

    if (uploadedImg != null) {
      image(filteredCanvas, 370, 105, 650, 460);
    } else {
      drawNoImageMessage(370, 105, 650, 460);
    }

    for (let i = 0; i < controls.length; i++) {
      drawControl(controls[i]);
    }

    backBtn = { x: 315, y: 645, w: 90, h: 35 };
    nextBtn = { x: 415, y: 645, w: 90, h: 35 };
    helpBtn = { x: 515, y: 645, w: 90, h: 35 };

    drawSmallButton(backBtn, "BACK");
    drawSmallButton(nextBtn, "NEXT");
    drawSmallButton(helpBtn, "HELP");
  };

  this.mousePressed = function() {
    if (mouseInRect(backBtn)) {
      playAnySound(backSound, 300, 80, "back");
      mgr.showScene(IntroScene);
      return;
    }

    if (mouseInRect(nextBtn)) {
      playAnySound(nextSound, 500, 80, "next");
      mgr.showScene(FinalScene);
      return;
    }

    if (mouseInRect(helpBtn)) {
      playAnySound(toggleSound, 700, 80, "toggle");
      mgr.showScene(HelpScene);
      return;
    }

    for (let i = 0; i < controls.length; i++) {
      let c = controls[i];

      // check if clicked the toggle button
      if (mouseX >= c.toggleX && mouseX <= c.toggleX + 66 &&
          mouseY >= c.toggleY + 9 && mouseY <= c.toggleY + 33) {
        c.on = !c.on;
        needsFilterUpdate = true;
        ditherDirty = true;
        playAnySound(toggleSound, 650, 60, "toggle");
      }

      // check if clicked the slider area
      if (mouseX >= c.sliderX && mouseX <= c.sliderX + c.sliderW &&
          mouseY >= c.sliderY + 9 && mouseY <= c.sliderY + 33) {
        c.val = constrain((mouseX - c.sliderX) / c.sliderW, 0, 1);
        c.dragging = true;
        needsFilterUpdate = true;
        ditherDirty = true;
        playAnySound(sliderSound, 420, 40, "slider");
      }
    }
  };

  this.mouseDragged = function() {
    for (let i = 0; i < controls.length; i++) {
      let c = controls[i];

      if (c.dragging == true) {
        c.val = constrain((mouseX - c.sliderX) / c.sliderW, 0, 1);
        needsFilterUpdate = true;
      }
    }
  };

  this.mouseReleased = function() {
    for (let i = 0; i < controls.length; i++) {
      controls[i].dragging = false;
    }
  };

  this.keyPressed = function() {
    handleSceneKeys();
  };
}


// ============================================================
// SCENE 3 - FINAL
// ============================================================

function FinalScene() {
  this.draw = function() {
    drawStudioBackground();

    drawScreenFrame(55, 55, 760, 575);

    if (uploadedImg != null) {
      // draw image at 580x470 so it doesnt stretch - matches the canvas size
      drawFinalImageToScreen(135, 105, 580, 470);
    } else {
      drawNoImageMessage(105, 105, 660, 470);
    }

    // right panel with woodg background
    drawRightPanel(835, 55, 230, 575);

    noStroke();
    fill(C.darkBrown);
    textAlign(LEFT);
    textStyle(BOLD);
    textSize(26);
    text("Final Print", 855, 95);

    textStyle(NORMAL);
    textSize(13);

    // moved labels down to match moved toggles/sliders
    text("Original Image Opacity", 855, 160);
    text("Edited Image Opacity", 855, 260);

    drawMixControl(originalMix);
    drawMixControl(editedMix);

    if (isSaving == true) {
      fill(C.red);
      text("Saving...", 855, 360);
    }

    backBtn = { x: 855, y: 455, w: 190, h: 40 };
    saveBtn = { x: 855, y: 510, w: 190, h: 40 };
    helpBtn = { x: 855, y: 565, w: 190, h: 40 };

    drawButton(backBtn, "BACK TO EDIT");
    drawButton(saveBtn, "SAVE PNG");
    drawButton(helpBtn, "HELP");
  };

  this.mousePressed = function() {
    if (mouseInRect(backBtn)) {
      playAnySound(backSound, 300, 80, "back");
      mgr.showScene(EditScene);
      return;
    }

    if (mouseInRect(saveBtn)) {
      downloadFinalImageOnly();
      return;
    }

    if (mouseInRect(helpBtn)) {
      playAnySound(toggleSound, 700, 80, "toggle");
      mgr.showScene(HelpScene);
      return;
    }

    checkMixMouse(originalMix);
    checkMixMouse(editedMix);
  };

  this.mouseDragged = function() {
    // scene 3 sliders move while dragging
    if (originalMix.dragging == true) {
      originalMix.val = constrain((mouseX - originalMix.x) / originalMix.w, 0, 1);
    }

    if (editedMix.dragging == true) {
      editedMix.val = constrain((mouseX - editedMix.x) / editedMix.w, 0, 1);
    }
  };

  this.mouseReleased = function() {
    originalMix.dragging = false;
    editedMix.dragging = false;
  };

  this.keyPressed = function() {
    handleSceneKeys();
  };
}


// ============================================================
// SCENE 4 - HELP
// ============================================================

function HelpScene() {
  this.draw = function() {
    drawStudioBackground();

    fill(C.offWhite);
    stroke(C.darkBrown);
    strokeWeight(3);
    rect(130, 60, 840, 560);

    noStroke();
    fill(C.darkBrown);
    textAlign(LEFT);
    textStyle(BOLD);
    textSize(50);
    text("Help / About", 170, 130);

    textStyle(BOLD);
    textSize(30);
    text("Filters:", 170, 220);

    textStyle(NORMAL);
    textSize(15);
    text("Red, Blue, Green - adjust each color channel.", 195, 275);
    text("Mono Grain - adds film grain noise.", 195, 298);
    text("Riso Dither - dithering effect.", 195, 321);
    text("Riso Halftone - dot pattern.", 195, 344);
    text("FIP Glitch - chromatic aberration", 195, 367);
    text("FIP Bloom - adds a soft glow to bright areas.", 195, 390);
    text("FIP Contrast - makes darks darker, lights lighter.", 195, 413);
    text("FIP Dilate - expands bright pixel areas.", 195, 436);
    text("FIP Kuwahara - painterly smoothing filter.", 195, 459);

    textStyle(BOLD);
    textSize(30);
    text("Keys:", 170, 510);

    textStyle(NORMAL);
    textSize(17);
    text("1 = Upload   2 = Edit   3 = Final   4 or H = Help   S = Save", 195, 545);

    backBtn = { x: 435, y: 575, w: 230, h: 40 };
    drawButton(backBtn, "BACK");
  };

  this.mousePressed = function() {
    if (mouseInRect(backBtn)) {
      playAnySound(backSound, 300, 80, "back");

      if (uploadedImg != null) {
        mgr.showScene(EditScene);
      } else {
        mgr.showScene(IntroScene);
      }
    }
  };

  this.keyPressed = function() {
    handleSceneKeys();
  };
}


// ============================================================
// KEYBOARD HELPER
// ============================================================

function handleSceneKeys() {
  if (key == "1") {
    mgr.showScene(IntroScene);
  }

  if (key == "2" && uploadedImg != null) {
    mgr.showScene(EditScene);
  }

  if (key == "3" && uploadedImg != null) {
    mgr.showScene(FinalScene);
  }

  if (key == "4" || key == "h" || key == "H") {
    mgr.showScene(HelpScene);
  }

  if (key == "s" || key == "S") {
    downloadFinalImageOnly();
  }
}


// ============================================================
// FILTER UPDATE
// ============================================================

function updateFilteredImages() {
  if (uploadedImg == null) {
    return;
  }

  renderOriginalPreview(originalFinalCanvas);
  renderFilteredPreview(filteredCanvas);
  renderFilteredPreview(filteredFinalCanvas);
}

function renderOriginalPreview(g) {
  g.clear();

  if (paperImg != null) {
    g.image(paperImg, 0, 0, g.width, g.height);
  } else {
    g.background(C.offWhite);
  }

  let fit = getFit(uploadedImg, 0, 0, g.width, g.height, 0.92);
  g.image(uploadedImg, fit.x, fit.y, fit.w, fit.h);
}

function renderFilteredPreview(g) {
  g.clear();

  if (paperImg != null) {
    g.image(paperImg, 0, 0, g.width, g.height);
  } else {
    g.background(C.offWhite);
  }

  let fit = getFit(uploadedImg, 0, 0, g.width, g.height, 0.92);
  g.image(uploadedImg, fit.x, fit.y, fit.w, fit.h);

  applyAllFilters(g, fit);
}

function renderFilteredTransparent(g) {
  g.clear();

  let fit = getFit(uploadedImg, 0, 0, g.width, g.height, 0.92);
  g.image(uploadedImg, fit.x, fit.y, fit.w, fit.h);

  applyAllFilters(g, fit);
}

function applyAllFilters(g, fit) {
  // doing pixel-heavy filters first before the drawing ones

  if (getOn("red") || getOn("blue") || getOn("green")) {
    applyRGBChannels(g, fit);
  }

  if (getOn("contrast")) {
    applyContrast(g, fit, getVal("contrast"));
  }

  if (getOn("dilate")) {
    drawDilate(g, fit, getVal("dilate"));
  }

  if (getOn("kuwahara")) {
    drawKuwahara(g, fit, getVal("kuwahara"));
  }

  // drawing filters go after pixel filters
  if (getOn("dither")) {
    drawRisoDither(g, fit, getVal("dither"));
  }

  if (getOn("halftone")) {
    drawRisoHalftone(g, fit, getVal("halftone"));
  }

  if (getOn("glitch")) {
    drawGlitchChromatic(g, fit, getVal("glitch"));
  }

  if (getOn("bloom")) {
    drawBloom(g, fit, getVal("bloom"));
  }

  if (getOn("grain")) {
    applyMonoGrain(g, fit, getVal("grain"));
  }
}


// ============================================================
// FILTERS
// ============================================================

function applyRGBChannels(g, fit) {
  let redPower   = getOn("red")   ? map(getVal("red"),   0, 1, 0, 1.8) : 1;
  let greenPower = getOn("green") ? map(getVal("green"), 0, 1, 0, 1.8) : 1;
  let bluePower  = getOn("blue")  ? map(getVal("blue"),  0, 1, 0, 1.8) : 1;

  let x1 = constrain(floor(fit.x), 0, g.width);
  let y1 = constrain(floor(fit.y), 0, g.height);
  let x2 = constrain(floor(fit.x + fit.w), 0, g.width);
  let y2 = constrain(floor(fit.y + fit.h), 0, g.height);

  g.loadPixels();

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let index = 4 * (y * g.width + x);

      g.pixels[index]     = constrain(g.pixels[index]     * redPower,   0, 255);
      g.pixels[index + 1] = constrain(g.pixels[index + 1] * greenPower, 0, 255);
      g.pixels[index + 2] = constrain(g.pixels[index + 2] * bluePower,  0, 255);
    }
  }

  g.updatePixels();
}

function applyMonoGrain(g, fit, amount) {
  if (amount <= 0.01) return;

  let x1 = constrain(floor(fit.x), 0, g.width);
  let y1 = constrain(floor(fit.y), 0, g.height);
  let x2 = constrain(floor(fit.x + fit.w), 0, g.width);
  let y2 = constrain(floor(fit.y + fit.h), 0, g.height);

  // reduce count multiplier a bit for performance
  let countMultiplier = 0.09;
  let count = int(amount * (x2 - x1) * (y2 - y1) * countMultiplier);
  let noiseAmount = map(amount, 0, 1, 6, 55);

  g.loadPixels();

  for (let i = 0; i < count; i++) {
    let x = floor(random(x1, x2));
    let y = floor(random(y1, y2));
    let index = 4 * (y * g.width + x);

    // same value for r g b so it stays grey/mono
    let n = random(-noiseAmount, noiseAmount);

    g.pixels[index]     = constrain(g.pixels[index]     + n, 0, 255);
    g.pixels[index + 1] = constrain(g.pixels[index + 1] + n, 0, 255);
    g.pixels[index + 2] = constrain(g.pixels[index + 2] + n, 0, 255);
  }

  g.updatePixels();
}

function drawRisoDither(g, fit, amount) {
  let ditherAlpha = map(amount, 0, 1, 0, 200);

  if (ditherAlpha <= 1) {
    return;
  }

  // make a copy of g to read from
  let temp = createGraphics(g.width, g.height);
  temp.pixelDensity(1);
  temp.clear();
  temp.image(g, 0, 0);
  temp.loadPixels();

  let w = temp.width;
  let h = temp.height;

  // convert to greyscale values array for the dithering math
  let values = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    let index = i * 4;
    values[i] =
      temp.pixels[index]     * 0.299 +
      temp.pixels[index + 1] * 0.587 +
      temp.pixels[index + 2] * 0.114;
  }

  let x1 = constrain(floor(fit.x), 0, w - 2);
  let y1 = constrain(floor(fit.y), 0, h - 2);
  let x2 = constrain(floor(fit.x + fit.w), 1, w - 2);
  let y2 = constrain(floor(fit.y + fit.h), 1, h - 2);

  // floyd steinberg dithering
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let i = y * w + x;
      let oldPixel = values[i];
      let newPixel = oldPixel < 128 ? 0 : 255;
      let err = oldPixel - newPixel;

      values[i] = newPixel;

      if (x + 1 < x2)          values[i + 1]         += err * 7 / 16;
      if (y + 1 < y2 && x > x1) values[i + w - 1]    += err * 3 / 16;
      if (y + 1 < y2)            values[i + w]         += err * 5 / 16;
      if (y + 1 < y2 && x + 1 < x2) values[i + w + 1] += err * 1 / 16;
    }
  }

  temp.clear();
  temp.loadPixels();

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let i = y * w + x;
      let index = i * 4;

      if (values[i] < 128) {
        temp.pixels[index]     = 255;
        temp.pixels[index + 1] = 35;
        temp.pixels[index + 2] = 170;
        temp.pixels[index + 3] = ditherAlpha;
      } else {
        temp.pixels[index + 3] = 0;
      }
    }
  }

  temp.updatePixels();
  g.image(temp, 0, 0);
  temp.remove();
}

function drawRisoHalftone(g, fit, amount) {
  if (amount <= 0.01) {
    return;
  }

  // bigger gap step = faster, lower quality is fine for a screen print look
  let minDot = 4;
  let gap    = map(amount, 0, 1, 24, 6);
  let maxDot = map(amount, 0, 1, 22, minDot);
  let dotAlpha = 128;

  g.loadPixels();
  let oldPixels = new Uint8ClampedArray(g.pixels);

  g.push();
  g.noStroke();

  for (let y = fit.y; y < fit.y + fit.h; y += gap) {
    for (let x = fit.x; x < fit.x + fit.w; x += gap) {
      let sx = constrain(floor(x), 0, g.width  - 1);
      let sy = constrain(floor(y), 0, g.height - 1);
      let index = 4 * (sy * g.width + sx);

      let bright =
        oldPixels[index]     * 0.299 +
        oldPixels[index + 1] * 0.587 +
        oldPixels[index + 2] * 0.114;

      let dotSize = map(bright, 0, 255, maxDot, minDot * 0.4);

      g.fill(0, 0, 0, dotAlpha);
      g.ellipse(x, y, dotSize, dotSize);
    }
  }

  g.pop();
}

function drawGlitchChromatic(g, fit, amount) {
  let intensity = map(amount, 0, 1, 0.1, 2.0);
  let shift = intensity * 8;

  let temp = createGraphics(g.width, g.height);
  temp.pixelDensity(1);
  temp.clear();
  temp.image(g, 0, 0);

  g.push();
  g.blendMode(SCREEN);

  g.tint(255, 0, 70, 120);
  g.image(temp, fit.x + shift, fit.y, fit.w, fit.h, fit.x, fit.y, fit.w, fit.h);

  g.tint(0, 255, 120, 85);
  g.image(temp, fit.x, fit.y - shift * 0.4, fit.w, fit.h, fit.x, fit.y, fit.w, fit.h);

  g.tint(0, 140, 255, 120);
  g.image(temp, fit.x - shift, fit.y + shift * 0.25, fit.w, fit.h, fit.x, fit.y, fit.w, fit.h);

  g.noTint();
  g.blendMode(BLEND);
  g.pop();

  temp.remove();
}

function drawBloom(g, fit, amount) {
  let intensity = map(amount, 0, 1, 0.1, 5);
  let glow = map(amount, 0, 1, 0.1, 3);
  let copies = int(map(intensity, 0.1, 5, 1, 4)); // was 5 copies, now max 4

  let temp = createGraphics(g.width, g.height);
  temp.pixelDensity(1);
  temp.clear();
  temp.image(g, 0, 0);

  g.push();
  g.blendMode(ADD);

  for (let i = 1; i <= copies; i++) {
    let grow = i * glow * 2;

    g.tint(255, 255, 255, 8 + intensity * 4);
    g.image(
      temp,
      fit.x - grow,
      fit.y - grow,
      fit.w + grow * 2,
      fit.h + grow * 2,
      fit.x,
      fit.y,
      fit.w,
      fit.h
    );
  }

  g.noTint();
  g.blendMode(BLEND);
  g.pop();

  temp.remove();
}

function applyContrast(g, fit, amount) {
  if (amount <= 0.01) return;

  let contrastAmount = map(amount, 0, 1, 0.1, 4.0);

  let x1 = constrain(floor(fit.x), 0, g.width);
  let y1 = constrain(floor(fit.y), 0, g.height);
  let x2 = constrain(floor(fit.x + fit.w), 0, g.width);
  let y2 = constrain(floor(fit.y + fit.h), 0, g.height);

  g.loadPixels();

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let index = 4 * (y * g.width + x);

      g.pixels[index]     = constrain((g.pixels[index]     - 128) * contrastAmount + 128, 0, 255);
      g.pixels[index + 1] = constrain((g.pixels[index + 1] - 128) * contrastAmount + 128, 0, 255);
      g.pixels[index + 2] = constrain((g.pixels[index + 2] - 128) * contrastAmount + 128, 0, 255);
    }
  }

  g.updatePixels();
}

function drawDilate(g, fit, amount) {
  if (amount <= 0.01) return;

  // radius of 1 or 2 max for speed - 3 was really slow
  let radius = max(1, int(amount * 2));

  let x1 = constrain(floor(fit.x), 0, g.width);
  let y1 = constrain(floor(fit.y), 0, g.height);
  let x2 = constrain(floor(fit.x + fit.w), 0, g.width);
  let y2 = constrain(floor(fit.y + fit.h), 0, g.height);

  g.loadPixels();
  let oldPixels = new Uint8ClampedArray(g.pixels);

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let maxR = 0;
      let maxG = 0;
      let maxB = 0;

      for (let yy = -radius; yy <= radius; yy++) {
        for (let xx = -radius; xx <= radius; xx++) {
          let nx = constrain(x + xx, x1, x2 - 1);
          let ny = constrain(y + yy, y1, y2 - 1);
          let ni = 4 * (ny * g.width + nx);

          if (oldPixels[ni]     > maxR) maxR = oldPixels[ni];
          if (oldPixels[ni + 1] > maxG) maxG = oldPixels[ni + 1];
          if (oldPixels[ni + 2] > maxB) maxB = oldPixels[ni + 2];
        }
      }

      let index = 4 * (y * g.width + x);

      g.pixels[index]     = maxR;
      g.pixels[index + 1] = maxG;
      g.pixels[index + 2] = maxB;
    }
  }

  g.updatePixels();
}

function drawKuwahara(g, fit, amount) {
  if (amount <= 0.01) return;

  let radius = max(2, int(map(amount, 0, 1, 2, 4))); // max radius 4 instead of 5
  let stepSize = 3; // was 2, now 3 - a bit faster, still looks ok

  let x1 = constrain(floor(fit.x), 0, g.width);
  let y1 = constrain(floor(fit.y), 0, g.height);
  let x2 = constrain(floor(fit.x + fit.w), 0, g.width);
  let y2 = constrain(floor(fit.y + fit.h), 0, g.height);

  g.loadPixels();
  let oldPixels = new Uint8ClampedArray(g.pixels);

  for (let y = y1; y < y2; y += stepSize) {
    for (let x = x1; x < x2; x += stepSize) {
      let bestVar = 999999999;
      let bestR = 0;
      let bestG = 0;
      let bestB = 0;

      // the four quadrant regions around this pixel
      let quads = [
        { dx0: -radius, dx1: 0, dy0: -radius, dy1: 0 },
        { dx0: 0, dx1: radius, dy0: -radius, dy1: 0 },
        { dx0: -radius, dx1: 0, dy0: 0, dy1: radius },
        { dx0: 0, dx1: radius, dy0: 0, dy1: radius }
      ];

      for (let q = 0; q < 4; q++) {
        let quad = quads[q];

        let count = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;

        for (let yy = quad.dy0; yy <= quad.dy1; yy++) {
          for (let xx = quad.dx0; xx <= quad.dx1; xx++) {
            let nx = constrain(x + xx, x1, x2 - 1);
            let ny = constrain(y + yy, y1, y2 - 1);
            let ni = 4 * (ny * g.width + nx);

            sumR += oldPixels[ni];
            sumG += oldPixels[ni + 1];
            sumB += oldPixels[ni + 2];
            count++;
          }
        }

        let meanR = sumR / count;
        let meanG = sumG / count;
        let meanB = sumB / count;

        let variance = 0;

        for (let yy = quad.dy0; yy <= quad.dy1; yy++) {
          for (let xx = quad.dx0; xx <= quad.dx1; xx++) {
            let nx = constrain(x + xx, x1, x2 - 1);
            let ny = constrain(y + yy, y1, y2 - 1);
            let ni = 4 * (ny * g.width + nx);

            let dr = oldPixels[ni]     - meanR;
            let dg = oldPixels[ni + 1] - meanG;
            let db = oldPixels[ni + 2] - meanB;

            variance += dr * dr + dg * dg + db * db;
          }
        }

        if (variance < bestVar) {
          bestVar = variance;
          bestR = meanR;
          bestG = meanG;
          bestB = meanB;
        }
      }

      // fill the step block with the result
      for (let yy = 0; yy < stepSize; yy++) {
        for (let xx = 0; xx < stepSize; xx++) {
          let px = x + xx;
          let py = y + yy;

          if (px < x2 && py < y2) {
            let index = 4 * (py * g.width + px);

            g.pixels[index]     = bestR;
            g.pixels[index + 1] = bestG;
            g.pixels[index + 2] = bestB;
          }
        }
      }
    }
  }

  g.updatePixels();
}


// ============================================================
// FINAL IMAGE SAVE
// saves a transparent PNG if transparent 
// ============================================================

function downloadFinalImageOnly() {
  if (uploadedImg == null || isSaving == true) {
    playAnySound(toggleSound, 90, 120, "toggle");
    return;
  }

  isSaving = true;
  playAnySound(saveSound, 280, 120, "save");

  // small delay so the "Saving..." text can show up first
  setTimeout(makeAndDownloadFinalImage, 50);
}

function makeAndDownloadFinalImage() {
  finalOutput = createGraphics(580, 470);
  finalOutput.pixelDensity(1);
  finalOutput.clear();

  let transparentOriginal = createGraphics(580, 470);
  transparentOriginal.pixelDensity(1);
  transparentOriginal.clear();

  let transparentEdited = createGraphics(580, 470);
  transparentEdited.pixelDensity(1);
  transparentEdited.clear();

  let fit = getFit(uploadedImg, 0, 0, 580, 470, 0.92);
  transparentOriginal.image(uploadedImg, fit.x, fit.y, fit.w, fit.h);

  renderFilteredTransparent(transparentEdited);

  let origAlpha = originalMix.val * 255;
  let editAlpha = editedMix.val  * 255;

  if (originalMix.on == true) {
    finalOutput.push();
    finalOutput.tint(255, origAlpha);
    finalOutput.image(transparentOriginal, 0, 0);
    finalOutput.pop();
  }

  if (editedMix.on == true) {
    finalOutput.push();
    finalOutput.tint(255, editAlpha);
    finalOutput.image(transparentEdited, 0, 0);
    finalOutput.pop();
  }

  let link = document.createElement("a");
  link.download = "screenprintfinal.png";
  link.href = finalOutput.canvas.toDataURL("image/png");
  link.click();

  transparentOriginal.remove();
  transparentEdited.remove();

  isSaving = false;
}


// ============================================================
// UI DRAWING
// ============================================================

function drawStudioBackground() {
  if (woodImg != null) {
    image(woodImg, 0, 0, width, height);
  } else {
    // fallback grid pattern if wood.png didnt load
    background(C.offWhite);

    stroke(C.grid);
    strokeWeight(1);

    for (let x = 0; x < width; x += 40) {
      line(x, 0, x, height);
    }

    for (let y = 0; y < height; y += 40) {
      line(0, y, width, y);
    }

    noStroke();
  }
}

function drawLeftPanel() {
  // left panel uses woodg texture
  if (panelWoodImg != null) {
    image(panelWoodImg, 0, 0, 300, height);
  } else {
    fill(C.panelPink);
    noStroke();
    rect(0, 0, 300, height);
  }

  // semi transparent overlay so text is still readable
  fill(255, 226, 204, 80);
  noStroke();
  rect(0, 0, 300, height);

  stroke(C.darkBrown);
  strokeWeight(1);
  noFill();
  rect(0, 0, 300, height);

  noStroke();
  fill(C.darkBrown);
  textAlign(LEFT);
  textStyle(BOLD);
  textSize(22);
  text("Filter Controls", 18, 34);

  textStyle(NORMAL);
  textSize(12);
  text("All filters start in off postion.", 18, 56);
}

// draws the woodg panel on the right side for scene 3
function drawRightPanel(x, y, w, h) {
  if (panelWoodImg != null) {
    image(panelWoodImg, x, y, w, h);
  } else {
    fill(C.panelPink);
    noStroke();
    rect(x, y, w, h);
  }

  // same overlay as left panel
  fill(255, 226, 204, 80);
  noStroke();
  rect(x, y, w, h);

  stroke(C.darkBrown);
  strokeWeight(2);
  noFill();
  rect(x, y, w, h);
}

function drawScreenFrame(x, y, w, h) {
  fill(C.orange);
  stroke(C.darkBrown);
  strokeWeight(4);
  rect(x, y, w, h);

  if (paperImg != null) {
    image(paperImg, x + 30, y + 30, w - 60, h - 60);
  } else {
    fill(C.offWhite);
    stroke(C.darkBrown);
    strokeWeight(2);
    rect(x + 30, y + 30, w - 60, h - 60);
  }

  fill(255, 255, 255, 70);
  noStroke();
  rect(x + 45, y + 45, w - 90, h - 90);

  // the little oval clamp things at the top
  fill(C.darkBrown);
  ellipse(x + 70,      y + 18, 16, 8);
  ellipse(x + w - 70, y + 18, 16, 8);
}

function drawControl(c) {
  // card background
  noStroke();
  fill(255, 248, 232, 235);
  rect(c.toggleX - 6, c.toggleY - 6, 268, 48, 6);

  // label at the top of the card
  fill(C.darkBrown);
  textAlign(LEFT);
  textStyle(BOLD);
  textSize(11);
  text(c.label, c.toggleX, c.toggleY + 5);

  // toggle track
  stroke(C.darkBrown);
  strokeWeight(1);
  fill(c.on ? C.green : '#b86a6a');
  rect(c.toggleX, c.toggleY + 14, 42, 22, 11);

  // toggle knob
  noStroke();
  fill(C.cream);

  if (c.on == true) {
    ellipse(c.toggleX + 30, c.toggleY + 25, 16, 16);
  } else {
    ellipse(c.toggleX + 12, c.toggleY + 25, 16, 16);
  }

  // slider track
  stroke(C.darkBrown);
  strokeWeight(1);
  fill(255);
  rect(c.sliderX, c.sliderY + 20, c.sliderW, 8, 4);

  // slider fill
  noStroke();
  fill(c.on ? C.blue : '#c49292');
  if (c.sliderW * c.val > 0) {
    rect(c.sliderX, c.sliderY + 20, c.sliderW * c.val, 8, 4);
  }

  // slider knob
  stroke(C.darkBrown);
  strokeWeight(1);
  fill(c.on ? C.orange : C.cream);
  ellipse(c.sliderX + c.sliderW * c.val, c.sliderY + 24, 16, 16);
}

function drawMixControl(c) {
  // toggle for the mix control - same size as scene 2 toggle
  stroke(C.darkBrown);
  strokeWeight(1);
  fill(c.on ? C.green : '#b86a6a');
  rect(c.x - 52, c.y, 42, 22, 11);

  noStroke();
  fill(C.cream);

  if (c.on == true) {
    ellipse(c.x - 22, c.y + 11, 16, 16);
  } else {
    ellipse(c.x - 40, c.y + 11, 16, 16);
  }

  // slider
  stroke(C.darkBrown);
  strokeWeight(1);
  fill(255);
  rect(c.x, c.y + 7, c.w, 8, 4);

  noStroke();
  fill(c.on ? C.blue : '#c49292');
  if (c.w * c.val > 0) {
    rect(c.x, c.y + 7, c.w * c.val, 8, 4);
  }

  stroke(C.darkBrown);
  strokeWeight(1);
  fill(C.orange);
  ellipse(c.x + c.w * c.val, c.y + 11, 16, 16);
}

function drawFinalImageToScreen(x, y, w, h) {
  // draw a background rect first
  fill(C.offWhite);
  stroke(C.darkBrown);
  strokeWeight(2);
  rect(x, y, w, h);

  let origAlpha = originalMix.val * 255;
  let editAlpha = editedMix.val  * 255;

  // draw at the canvas's actual size (580x470) to avoid stretching
  if (originalMix.on == true) {
    push();
    tint(255, origAlpha);
    image(originalFinalCanvas, x, y, w, h);
    pop();
  }

  if (editedMix.on == true) {
    push();
    tint(255, editAlpha);
    image(filteredFinalCanvas, x, y, w, h);
    pop();
  }

  // border on top
  noFill();
  stroke(C.darkBrown);
  strokeWeight(2);
  rect(x, y, w, h);
}

function drawNoImageMessage(x, y, w, h) {
  fill(C.offWhite);
  stroke(C.darkBrown);
  rect(x, y, w, h);

  fill(C.darkBrown);
  noStroke();
  textAlign(CENTER);
  textSize(24);
  text("No image uploaded yet", x + w / 2, y + h / 2 - 10);

  textSize(16);
  text("Go back to screen 1 and upload an image.", x + w / 2, y + h / 2 + 25);
}

function drawButton(r, label) {
  let hover = mouseInRect(r);

  noStroke();
  fill(hover ? C.blue : C.orange);
  rect(r.x, r.y, r.w, r.h, 4);

  fill(C.cream);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(14);
  text(label, r.x + r.w / 2, r.y + r.h / 2);
}

function drawDisabledButton(r, label) {
  noStroke();
  fill('#b86a6a');
  rect(r.x, r.y, r.w, r.h, 4);

  fill(C.cream);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(14);
  text(label, r.x + r.w / 2, r.y + r.h / 2);
}

function drawSmallButton(r, label) {
  let hover = mouseInRect(r);

  noStroke();
  fill(hover ? C.blue : C.orange);
  rect(r.x, r.y, r.w, r.h, 4);

  fill(C.cream);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(12);
  text(label, r.x + r.w / 2, r.y + r.h / 2);
}


// ============================================================
// HELPERS
// ============================================================

function mouseInRect(r) {
  return mouseX >= r.x &&
         mouseX <= r.x + r.w &&
         mouseY >= r.y &&
         mouseY <= r.y + r.h;
}

function getVal(id) {
  for (let i = 0; i < controls.length; i++) {
    if (controls[i].id == id) {
      return controls[i].val;
    }
  }

  return 0;
}

function getOn(id) {
  for (let i = 0; i < controls.length; i++) {
    if (controls[i].id == id) {
      return controls[i].on;
    }
  }

  return false;
}

function getFit(img, x, y, w, h, scaleAmount) {
  let iw = img.width;
  let ih = img.height;

  // scale to fit inside the box while keeping aspect ratio
  let scaleValue = min(w / iw, h / ih) * scaleAmount;

  let newW = iw * scaleValue;
  let newH = ih * scaleValue;

  // center it
  let newX = x + w / 2 - newW / 2;
  let newY = y + h / 2 - newH / 2;

  return {
    x: newX,
    y: newY,
    w: newW,
    h: newH
  };
}

function checkMixMouse(c) {
  // clicking the toggle button
  if (mouseX >= c.x - 52 && mouseX <= c.x - 10 &&
      mouseY >= c.y && mouseY <= c.y + 22) {
    c.on = !c.on;
    playAnySound(toggleSound, 650, 60, "toggle");
    return;
  }

  // clicking or dragging the slider
  if (mouseX >= c.x && mouseX <= c.x + c.w &&
      mouseY >= c.y - 10 && mouseY <= c.y + 30) {
    c.val = constrain((mouseX - c.x) / c.w, 0, 1);
    c.dragging = true;
    playAnySound(sliderSound, 420, 40, "slider");
  }
}


// ============================================================
// SOUND
// 2 second cooldown per sound so it doesnt spam
// ============================================================

function playAnySound(snd, backupFreq, backupTime, soundName) {
  let now = millis();

  if (lastSoundTimes[soundName] != null) {
    if (now - lastSoundTimes[soundName] < 2000) {
      return;
    }
  }

  lastSoundTimes[soundName] = now;

  if (snd != null && snd.isLoaded && snd.isLoaded()) {
    snd.play();
  } else {
    playBeep(backupFreq, backupTime);
  }
}

function playBeep(freq, duration) {
  if (typeof p5 === "undefined" || typeof p5.Oscillator === "undefined") {
    return;
  }

  let osc = new p5.Oscillator("sine");
  osc.freq(freq);
  osc.amp(0.08);
  osc.start();

  setTimeout(function() {
    osc.stop();
  }, duration);
}