var colours = new Array("#a6f", "#60f", "#60f", "#a6f", "#ccc");
var bubbles = 66;
var over_or_under = "over";

var swide = 800;
var shigh = 600;
var bubb = new Array();
var bubbx = new Array();
var bubby = new Array();
var bubbs = new Array();
var boddie;

var ie_version =
  navigator.appVersion.indexOf("MSIE") !== -1
    ? parseFloat(navigator.appVersion.split("MSIE")[1])
    : false;

function addLoadEvent(funky) {
  var oldonload = window.onload;

  if (typeof oldonload !== "function") {
    window.onload = funky;
  } else {
    window.onload = function () {
      if (oldonload) oldonload();
      funky();
    };
  }
}

addLoadEvent(bubba);

function bubba() {
  if (!document.getElementById) return;

  var i;
  var rats;
  var div;

  boddie = document.createElement("div");
  boddie.style.position = "fixed";
  boddie.style.top = "0px";
  boddie.style.left = "0px";
  boddie.style.overflow = "visible";
  boddie.style.width = "1px";
  boddie.style.height = "1px";
  boddie.style.backgroundColor = "transparent";
  boddie.style.zIndex = "0";

  document.body.appendChild(boddie);

  set_width();

  for (i = 0; i < bubbles; i++) {
    rats = createDiv("3px", "3px");

    div = createDiv("auto", "auto");
    rats.appendChild(div);

    div = div.style;
    div.top = "1px";
    div.left = "0px";
    div.bottom = "1px";
    div.right = "0px";
    div.borderLeft = "1px solid " + colours[3];
    div.borderRight = "1px solid " + colours[1];

    div = createDiv("auto", "auto");
    rats.appendChild(div);

    div = div.style;
    div.top = "0px";
    div.left = "1px";
    div.right = "1px";
    div.bottom = "0px";
    div.borderTop = "1px solid " + colours[0];
    div.borderBottom = "1px solid " + colours[2];

    div = createDiv("auto", "auto");
    rats.appendChild(div);

    div = div.style;
    div.left = "1px";
    div.right = "1px";
    div.bottom = "1px";
    div.top = "1px";
    div.backgroundColor = colours[4];

    if (ie_version && ie_version < 10) {
      div.filter = "alpha(opacity=50)";
    } else {
      div.opacity = 0.5;
    }

    boddie.appendChild(rats);

    bubb[i] = rats.style;
    bubb[i].zIndex = over_or_under === "over" ? "1001" : "0";
  }

  bubble();
}

function bubble() {
  var c;

  for (c = 0; c < bubbles; c++) {
    if (!bubby[c] && Math.random() < 0.333) {
      bubb[c].left =
        (bubbx[c] = Math.floor(swide / 6 + Math.random() * (swide / 1.5)) - 10) +
        "px";

      bubb[c].top = (bubby[c] = shigh) + "px";
      bubb[c].width = "3px";
      bubb[c].height = "3px";
      bubb[c].visibility = "visible";
      bubbs[c] = 3;

      break;
    }
  }

  for (c = 0; c < bubbles; c++) {
    if (bubby[c]) update_bubb(c);
  }

  setTimeout(bubble, 40);
}

function update_bubb(i) {
  if (!bubby[i]) return;

  bubby[i] -= bubbs[i] / 2 + (i % 2);
  bubbx[i] += (i % 5 - 2) / 5;

  if (bubby[i] > 0 && bubbx[i] > 0 && bubbx[i] < swide) {
    if (Math.random() < (bubbs[i] / shigh) * 2 && bubbs[i]++ < 8) {
      bubb[i].width = bubbs[i] + "px";
      bubb[i].height = bubbs[i] + "px";
    }

    bubb[i].top = bubby[i] + "px";
    bubb[i].left = bubbx[i] + "px";
  } else {
    bubb[i].visibility = "hidden";
    bubby[i] = 0;
  }
}

addLoadEvent(set_width);
window.onresize = set_width;

function set_width() {
  var sw_min = 999999;
  var sh_min = 999999;

  if (document.documentElement && document.documentElement.clientWidth) {
    if (document.documentElement.clientWidth > 0) {
      sw_min = document.documentElement.clientWidth;
    }

    if (document.documentElement.clientHeight > 0) {
      sh_min = document.documentElement.clientHeight;
    }
  }

  if (typeof self.innerWidth === "number" && self.innerWidth) {
    if (self.innerWidth > 0 && self.innerWidth < sw_min) {
      sw_min = self.innerWidth;
    }

    if (self.innerHeight > 0 && self.innerHeight < sh_min) {
      sh_min = self.innerHeight;
    }
  }

  if (document.body.clientWidth) {
    if (document.body.clientWidth > 0 && document.body.clientWidth < sw_min) {
      sw_min = document.body.clientWidth;
    }

    if (document.body.clientHeight > 0 && document.body.clientHeight < sh_min) {
      sh_min = document.body.clientHeight;
    }
  }

  if (sw_min === 999999 || sh_min === 999999) {
    sw_min = 800;
    sh_min = 600;
  }

  swide = sw_min;
  shigh = sh_min;
}

function createDiv(height, width) {
  var div = document.createElement("div");

  div.style.position = "absolute";
  div.style.height = height;
  div.style.width = width;
  div.style.overflow = "hidden";
  div.style.backgroundColor = "transparent";

  return div;
}

(() => {
  const reduceMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const layer = document.querySelector("#sparkle-layer");

  const audio = {
    startup: new Audio("assets/mp3/fl-studio-startup-sound.mp3"),
    minimize: new Audio("assets/mp3/minimize.mp3"),
    tab: new Audio("assets/mp3/chimes.mp3"),
    close: new Audio("assets/mp3/Windows Logoff Sound.wav"),
    maximize: new Audio("assets/mp3/Windows Pop-up Blocked.wav"),
    image: new Audio("assets/mp3/Windows Navigation Start.wav"),
  };

  audio.minimize.volume = 0.1;

  function sound(type) {
    const clip = audio[type];

    if (!clip) return;

    clip.currentTime = 0;
    clip.play().catch(() => {});
  }

  if (layer && !reduceMotion) {
    document.addEventListener(
      "pointermove",
      (event) => {
        if (Date.now() % 3) return;

        const sparkle = document.createElement("span");

        sparkle.className = "sparkle";
        sparkle.textContent = Math.random() > 0.45 ? "✦" : "·";
        sparkle.style.left = `${event.clientX}px`;
        sparkle.style.top = `${event.clientY}px`;

        layer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 850);
      },
      { passive: true },
    );
  }

  if (
    document.body.classList.contains("home-page") &&
    !sessionStorage.getItem("dos-seen")
  ) {
    const screen = document.createElement("div");

    screen.className = "dos-screen";
    screen.innerHTML = '<p></p><span class="dos-cursor"></span>';

    document.body.appendChild(screen);

    const output = screen.querySelector("p");
    const text =
      "C:\\RAY\\PORTFOLIO> portfolio.exe\n\nLoading...\nC:\\RAY\\PORTFOLIO> _";

    let index = 0;

    const type = () => {
      output.textContent = text.slice(0, index++);

      if (index <= text.length) {
        setTimeout(type, 24);
      } else {
        sound("startup");

        setTimeout(() => screen.remove(), 450);
      }
    };

    sessionStorage.setItem("dos-seen", "1");
    type();
  }

  document.querySelectorAll("[data-minimize]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest("[data-window]");

      if (!panel) return;

      sound("minimize");
      panel.classList.remove("maximized");
      panel.classList.toggle("minimized");
      button.textContent = "−";
    });
  });

  document.querySelectorAll("[data-maximize]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest("[data-window]");

      if (!panel) return;

      sound("maximize");
      panel.classList.remove("minimized");
      panel.classList.toggle("maximized");
      button.textContent = "□";
    });
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      sound("close");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 90);
    });
  });

  document
    .querySelectorAll(".top-nav a, .footer-tabs a, .room-hotspot")
    .forEach((link) => {
      link.addEventListener("click", () => sound("tab"));
    });

  document.querySelectorAll(".window-titlebar > span").forEach((title) => {
    const label = [...title.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    );

    if (!label || /\.(txt|docx?)\s*$/i.test(label.textContent.trim())) {
      return;
    }

    label.textContent += /about/i.test(label.textContent)
      ? ".txt"
      : /175/i.test(label.textContent)
        ? ".doc"
        : ".docx";
  });

  const galleryCards = [
    ...document.querySelectorAll(
      ".polaroid, .school-polaroid, .portrait-card",
    ),
  ];

  let galleryIndex = -1;

  function stopVideo(media) {
    if (media?.tagName !== "VIDEO") return;

    media.pause();
    media.currentTime = 0;
  }

  function closeLightbox(box) {
    stopVideo(box.querySelector(".media-holder video"));
    box.classList.remove("open");
  }

  function showGalleryItem(index) {
    galleryIndex = (index + galleryCards.length) % galleryCards.length;

    const card = galleryCards[galleryIndex];
    const media = card.querySelector("img, video");

    if (!media) return;

    stopVideo(media);

    const box =
      document.querySelector(".lightbox:not(.project-viewer)") ||
      (() => {
        const element = document.createElement("div");

        element.className = "lightbox";
        element.innerHTML =
'<button class="lightbox-prev" type="button" aria-label="Previous image">‹</button><button class="lightbox-next" type="button" aria-label="Next image">›</button><button class="lightbox-close" type="button" aria-label="Close enlarged image">×</button><div class="media-holder"></div><p class="lightbox-description"></p>';
        document.body.appendChild(element);

        element.addEventListener("click", (event) => {
          if (
            event.target === element ||
            event.target.closest(".lightbox-close")
          ) {
            closeLightbox(element);
          }

          if (event.target.closest(".lightbox-prev")) {
            showGalleryItem(galleryIndex - 1);
          }

          if (event.target.closest(".lightbox-next")) {
            showGalleryItem(galleryIndex + 1);
          }
        });

        return element;
      })();

    stopVideo(box.querySelector(".media-holder video"));

    box
      .querySelector(".media-holder")
      .replaceChildren(media.cloneNode(true));
const description = box.querySelector(".lightbox-description");

description.textContent = (card.dataset.description || "").trim();description.hidden = !description.textContent;
    box.classList.add("open");
  }

  document
    .querySelectorAll(".polaroid, .school-polaroid, .portrait-card")
    .forEach((card) => {
      const media = card.querySelector("img, video");

      if (!media) return;

      media.addEventListener("mouseenter", () => {
        card.classList.add("image-hover");
      });

      media.addEventListener("mouseleave", () => {
        card.classList.remove("image-hover");
      });

      card.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;

        sound("image");
        showGalleryItem(galleryCards.indexOf(card));
      });
    });

  document.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", () => {
      sound("image");

      const viewer =
        document.querySelector(".project-viewer") ||
        (() => {
          const element = document.createElement("div");

          element.className = "lightbox project-viewer";
          element.innerHTML =
            '<button class="lightbox-close" type="button" aria-label="Close project">×</button><iframe title="Playable Art 101 project"></iframe>';

          document.body.appendChild(element);

          element.addEventListener("click", (event) => {
            if (
              event.target === element ||
              event.target.closest(".lightbox-close")
            ) {
              closeProject(element);
            }
          });

          return element;
        })();

      viewer.querySelector("iframe").src = button.dataset.project;
      viewer.classList.add("open");
    });
  });

  document.querySelectorAll("[data-video]").forEach((card) => {
    card.addEventListener("click", () => {
      const viewer =
        document.querySelector(".project-viewer") ||
        (() => {
          const element = document.createElement("div");

          element.className = "lightbox project-viewer";
          element.innerHTML =
            '<button class="lightbox-close" type="button" aria-label="Close video">×</button><iframe title="Enlarged Art 175 video" allow="autoplay; fullscreen; picture-in-picture"></iframe>';

          document.body.appendChild(element);

          element.addEventListener("click", (event) => {
            if (
              event.target === element ||
              event.target.closest(".lightbox-close")
            ) {
              closeProject(element);
            }
          });

          return element;
        })();

      const source = card.querySelector("iframe");

      if (source) {
        source.src = "about:blank";

        setTimeout(() => {
          source.src = card.dataset.video;
        }, 0);
      }

      viewer.querySelector("iframe").src = card.dataset.video;
      viewer.classList.add("open");
    });
  });

  function closeProject(viewer) {
    viewer.querySelector("iframe").src = "about:blank";
    viewer.classList.remove("open");
  }

  document.addEventListener("keydown", (event) => {
    const viewer = document.querySelector(".project-viewer.open");
    const lightbox = document.querySelector(
      ".lightbox.open:not(.project-viewer)",
    );

    if (event.key === "Escape") {
      if (viewer) closeProject(viewer);
      if (lightbox) closeLightbox(lightbox);
    } else if (lightbox && event.key === "ArrowLeft") {
      showGalleryItem(galleryIndex - 1);
    } else if (lightbox && event.key === "ArrowRight") {
      showGalleryItem(galleryIndex + 1);
    }
  });

  function scrollButtons(rail) {
    rail.scrollLeft += 2;

    if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1) {
      rail.scrollLeft = 0;
    }
  }

  document.querySelectorAll(".web-buttons").forEach((rail) => {
    let timer = setInterval(() => scrollButtons(rail), 20);

    rail.addEventListener("mouseenter", () => clearInterval(timer));

    rail.addEventListener("mouseleave", () => {
      timer = setInterval(() => scrollButtons(rail), 20);
    });
  });
})();