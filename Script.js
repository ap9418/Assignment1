const NEXT_PAGE_URL = "next.html"; // change this

const POPUPS = [
  { title: "OPERATING SYSTEM", img: "popup1.html", button: "OK" },
  { title: "SYSTEM UPDATE", img: "popup2.png", button: "CANCEL" },
  { title: "ERROR", img: "popup3.jpg", button: "RETRY" },
  { title: "CREATING…", img: "popup4.jpg", button: "WAIT" },
  { title: "PROCRASTINATION.EXE", img: "popup5.webp", button: "ENTER", final: true }
];

let topZ = 10;

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createWindow(data){
  const win = document.createElement("div");
  win.className = "window";
  win.style.zIndex = ++topZ;

  win.innerHTML = `
    <div class="titlebar">
      <span>${data.title}</span>
      <div class="controls">
        <div class="btn">–</div>
        <div class="btn">□</div>
        <div class="btn close">×</div>
      </div>
    </div>
    <div class="content">
      <img class="popup-img" src="${data.img}" />
      <div class="footer">
        <span class="muted">${data.final ? "Ready when you are." : "Processing…"}</span>
        <button class="action">${data.button}</button>
      </div>
    </div>
  `;

  document.body.appendChild(win);

  positionWindow(win);

  requestAnimationFrame(() => {
    win.dataset.state = "show";
  });

  makeDraggable(win, win.querySelector(".titlebar"));

  win.querySelector(".close").onclick = () => {
    if (data.final) {
      win.classList.add("shake");
    } else {
      win.remove();
    }
  };

  win.querySelector(".action").onclick = () => {
    if (data.final) {
      window.location.href = NEXT_PAGE_URL;
    } else {
      win.classList.add("shake");
    }
  };

  return win;
}

function positionWindow(win){
  const padding = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const x = Math.random() * (vw - 420 - padding);
  const y = Math.random() * (vh - 300 - padding);

  win.style.left = `${Math.max(padding, x)}px`;
  win.style.top = `${Math.max(padding, y)}px`;
}

function makeDraggable(win, handle){
  let startX, startY, offsetX, offsetY;

  handle.addEventListener("pointerdown", e => {
    win.style.zIndex = ++topZ;
    startX = e.clientX;
    startY = e.clientY;

    const rect = win.getBoundingClientRect();
    offsetX = rect.left;
    offsetY = rect.top;

    handle.setPointerCapture(e.pointerId);

    handle.onpointermove = e => {
      win.style.left = offsetX + (e.clientX - startX) + "px";
      win.style.top = offsetY + (e.clientY - startY) + "px";
    };

    handle.onpointerup = () => {
      handle.onpointermove = null;
    };
  });
}

async function run(){
  for (let i = 0; i < POPUPS.length; i++) {
    createWindow(POPUPS[i]);
    await sleep(650);
  }
}

run();
