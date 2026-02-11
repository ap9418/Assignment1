/* script.js
   Single-page progressive reveal:
   HOME visible initially.
   QUESTION revealed on ENTER.
   VIDEO revealed on YES.
   INTERACTIVE is inside VIDEO (scroll down after "Continue").
   GALLERY + ABOUT revealed after SUBMIT.
   Users can scroll back up through revealed content, but cannot scroll
   to hidden sections because hidden sections take no space.
*/

/* ----------------------------
   ELEMENT REFERENCES
---------------------------- */
const homeSection = document.getElementById("home");
const questionSection = document.getElementById("question");
const videoSection = document.getElementById("video");
const gallerySection = document.getElementById("gallery");
const aboutSection = document.getElementById("about");

const popupStage = document.getElementById("popupStage");

const enterBtn = document.getElementById("enterBtn");
const yesBtn = document.getElementById("yesBtn");
const procrastinateBtn = document.getElementById("procrastinateBtn");

const qTitle = document.getElementById("qTitle");
const qSub = document.getElementById("qSub");
const qButtons = document.getElementById("qButtons");

const deadlineTimer = document.getElementById("deadlineTimer");
const deadlineValue = document.getElementById("deadlineValue");

const reflectionAnchor = document.getElementById("reflection");
const reflectionSection = document.getElementById("reflection");
const rTitle = document.getElementById("rTitle");
const rSub = document.getElementById("rSub");
const rForm = document.getElementById("rForm");

const submitResponse = document.getElementById("submitResponse");
const beforePrompt = document.getElementById("beforePrompt");
const userResponse = document.getElementById("userResponse");

/* ----------------------------
   STATE
---------------------------- */
let loopMode = false;                 // true after user clicks "Let me procrastinate" successfully
let procrastinateDodgeCount = 0;      // 0 -> 1 -> 2, then click works
let countdownInterval = null;         // timer interval id
let remainingSeconds = 10 * 60;       // 10 minutes
let slideIndex = 1;

// --- NAV UNLOCK STATE  ---
let videoUnlockedByNav = false;
let galleryUnlockedByNav = false;
let reflectionTypingInProgress = false;

function unlockVideoFlow({ scrollTarget = "video" } = {}) {
  // Reveal VIDEO + REFLECTION (same sections as YES/READY flow)
  revealSection(videoSection);
  revealSection(reflectionSection);

  // Run the reflection typewriter once (so animation happens on first nav click too)
  if (!videoUnlockedByNav && !reflectionTypingInProgress) {
    videoUnlockedByNav = true;
    reflectionTypingInProgress = true;

    rForm.classList.add("hidden");
    beforePrompt.classList.add("hidden");
    beforePrompt.classList.remove("show");

    // Only type if it's not already typed
    const alreadyTyped = (rTitle.textContent || "").trim().length > 0;
    const runTyping = alreadyTyped
      ? Promise.resolve()
      : typeWriter(rTitle, "Finish this sentence:", 40)
          .then(() => typeWriter(rSub, "“I’ll start after I….”", 35));

    runTyping.then(() => {
      rForm.classList.remove("hidden");
      reflectionTypingInProgress = false;

      if (scrollTarget === "reflection") scrollToSection(reflectionSection);
      else scrollToSection(videoSection);
    });

    return; // prevent immediate scroll; we scroll after typing starts/finishes
  }

  // If already unlocked/typed, just scroll immediately
  if (scrollTarget === "reflection") scrollToSection(reflectionSection);
  else scrollToSection(videoSection);
}

function unlockGalleryFlow({ scrollTarget = "gallery" } = {}) {
  revealSection(gallerySection);
  revealSection(aboutSection);

  if (!galleryUnlockedByNav) {
    galleryUnlockedByNav = true;
    // make sure slideshow is ready once gallery is visible
    showSlides(slideIndex);
  }

  if (scrollTarget === "about") scrollToSection(aboutSection);
  else scrollToSection(gallerySection);
}

/* =========================================================
   HELPERS: reveal + scroll
   ========================================================= */
function revealSection(sectionEl){
  if (!sectionEl) return;
  sectionEl.classList.remove("hidden");
}

function scrollToSection(sectionEl){
  if (!sectionEl) return;
  sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================================================
   POPUP IMAGES ON HOME
   IMPORTANT:
   - Put your popup images inside: assets/popups/
   - Update filenames + positions below
   ========================================================= */
const popupPlan = [
  // Replace with your actual popup image filenames
  // x/y are % positions; w is width in px
  { src: "Media/Website (7).png", x: 37 , y: 36, z: 0, w: 350.3},
  { src: "Media/Website (4).png", x: 84, y: 41, z: 1, w: 389.3 },
  { src: "Media/Website (4).png", x: 82, y: 39, z: 1, w: 389.3 },
  { src: "Media/Website (4).png", x: 80, y: 37, z: 1, w: 389.3 },
  { src: "Media/Website (4).png", x: 78, y: 35, z: 1, w: 389.3 },
  { src: "Media/Website (3).png", x: 20, y: 23, z: 2, w: 420 },
  { src: "Media/Website.png", x: 19, y: 75, z: 3, w: 340 },
  { src: "Media/Website.png", x: 20, y: 72, z: 3, w: 340 },
  { src: "Media/Website.png", x: 21, y: 69, z: 3, w: 340 },
  { src: "Media/Website.png", x: 22, y: 66, z: 3, w: 340 },
  { src: "Media/Website (1).png", x: 50, y: 50, z: 4, w: 572 },
  { src: "Media/Website (2).png", x: 73, y: 72, z: 2, w: 520 }
];

function playPopups(){
  popupStage.innerHTML = "";
  // Hide Enter while popups are appearing (especially if replaying)
  enterBtn.classList.add("btn-hidden");
  enterBtn.classList.remove("btn-visible");

  popupPlan.forEach((item, index) => {
    const img = document.createElement("img");
    img.className = "popup-img";
    img.src = item.src;
    if (item.src.includes("Media/Website.png")) {
      img.classList.add("popup-start-working");
    }
    img.alt = ""; // decorative

    img.style.left = `${item.x}%`;
    img.style.top = `${item.y}%`;
    img.style.zIndex = item.z;

    if (item.w) img.style.width = `${item.w}px`;

    popupStage.appendChild(img);

    // Stagger each popup appearance
    setTimeout(() => {
      img.classList.add("show");

      // If this is the last popup, reveal the Enter button
      if (index === popupPlan.length - 1) {
        setTimeout(() => {
          enterBtn.classList.remove("btn-hidden");
          enterBtn.classList.add("btn-visible");
        }, 200); // small delay after the last popup
      }
    }, 220 * index);
  });
}

/* =========================================================
   TIMER
   ========================================================= */
function formatTime(totalSeconds){
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startDeadlineTimer(){
  if (countdownInterval) return;

  deadlineTimer.classList.remove("hidden");
  deadlineValue.textContent = formatTime(remainingSeconds);

  countdownInterval = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0){
      remainingSeconds = 0;
      deadlineValue.textContent = "00:00";
      clearInterval(countdownInterval);
      countdownInterval = null;
      return;
    }

    deadlineValue.textContent = formatTime(remainingSeconds);
  }, 1000);
}

/* =========================================================
   PROCRASTINATE BUTTON DODGE
   - moves twice, then click works
   ========================================================= */
function moveButtonSlightly(btn){
  // Only move sideways and slightly down, never up into the text
  const dx = Math.floor(Math.random() * 160) - 80;  // -80..80
  const dy = Math.floor(Math.random() * 30);        // 0..29 (down only)
  btn.style.transform = `translate(${dx}px, ${dy}px)`;
}

procrastinateBtn.addEventListener("click", (e) => {
  // First two attempts: dodge
  if (procrastinateDodgeCount < 2){
    e.preventDefault();
    procrastinateDodgeCount += 1;
    moveButtonSlightly(procrastinateBtn);
    return;
  }

  // Third attempt: works
  loopMode = true;
  enterBtn.textContent = "READY";
  startDeadlineTimer();

  // Reset dodge state for next time
  procrastinateDodgeCount = 0;
  procrastinateBtn.style.transform = "translate(0, 0)";

  // Return to HOME and replay popups
  scrollToSection(homeSection);
  playPopups();
});

function typeWriter(el, text, speed = 50){
  return new Promise((resolve) => {
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text.charAt(i);
      i += 1;
      if (i >= text.length){
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}
/* =========================================================
   BUTTON FLOW (progressive reveal)
   ========================================================= */

enterBtn.addEventListener("click", () => {
  // READY jumps straight to VIDEO
  if (enterBtn.textContent.trim().toUpperCase() === "READY") {
    revealSection(videoSection);
    revealSection(reflectionSection);
    scrollToSection(videoSection);

    rForm.classList.add("hidden");
    beforePrompt.classList.add("hidden");
    beforePrompt.classList.remove("show");

    typeWriter(rTitle, "Finish this sentence:", 55)
      .then(() => typeWriter(rSub, "“I’ll start after I….”", 50))
      .then(() => {
        rForm.classList.remove("hidden");
      });

    return;
  }

  procrastinateDodgeCount = 0;
  procrastinateBtn.style.transform = "translate(0, 0)";

  revealSection(questionSection);
  scrollToSection(questionSection);

  qButtons.classList.add("hidden");
  typeWriter(qTitle, "Before you start…quick question:", 30)
    .then(() => typeWriter(qSub, "Are you sure you’re ready to focus?", 25))
    .then(() => {
      qButtons.classList.remove("hidden");
    });
});

yesBtn.addEventListener("click", () => {
  revealSection(videoSection);
  revealSection(reflectionSection);
  scrollToSection(videoSection);

  rForm.classList.add("hidden");
  beforePrompt.classList.add("hidden");
  beforePrompt.classList.remove("show");

  typeWriter(rTitle, "Finish this sentence:", 40)
    .then(() => typeWriter(rSub, "“I’ll start after I….”", 35))
    .then(() => {
      rForm.classList.remove("hidden");
    });

  userResponse.value = "";
});

submitResponse.addEventListener("click", () => {
  // Reveal the realization line AFTER submit
  beforePrompt.classList.remove("hidden");
  requestAnimationFrame(() => {
    beforePrompt.classList.add("show");
  });

  revealSection(gallerySection);
  revealSection(aboutSection);

  // ensure slideshow is displayed now that gallery exists
  showSlides(slideIndex);
});

/* =========================================================
   NAVIGATION:
   - If section is hidden, send user to home (so they can't jump ahead).
   - If section is revealed, scroll to it.
   ========================================================= */
function initNav(){
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("data-nav");

      if (id === "home") {
        scrollToSection(homeSection);
        return;
      }

      if (id === "video") {
        unlockVideoFlow({ scrollTarget: "video" });
        return;
      }

      if (id === "reflection") {
        unlockVideoFlow({ scrollTarget: "reflection" });
        return;
      }

      if (id === "gallery") {
        unlockGalleryFlow({ scrollTarget: "gallery" });
        return;
      }

      if (id === "about") {
        unlockGalleryFlow({ scrollTarget: "about" });
        return;
      }

      // fallback (shouldn't happen)
      const section = document.getElementById(id);
      if (section) scrollToSection(section);
    });
  });
}

function initActiveNav(){
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = links
    .map(a => document.getElementById(a.dataset.nav))
    .filter(Boolean);

  function setActive(id){
    links.forEach(a => a.classList.toggle("active", a.dataset.nav === id));
  }

  const obs = new IntersectionObserver((entries) => {
    // pick the most visible section
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) setActive(visible.target.id);
  }, { root: null, threshold: [0.35, 0.55, 0.7] });

  sections.forEach(sec => obs.observe(sec));

  // default on load
  setActive("home");
}

/* =========================================================
   INITIAL LOAD
   ========================================================= */


function showSlides(n){
  const slides = document.querySelectorAll(".mySlides");
  const captionText = document.getElementById("caption");

  if (!slides.length) return;

  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;

  slides.forEach(s => (s.style.display = "none"));

  const activeSlide = slides[slideIndex - 1];
  activeSlide.style.display = "block";

  const img = activeSlide.querySelector("img");
  if (captionText) captionText.textContent = (img && img.alt) ? img.alt : "";
}

function plusSlides(n){
  showSlides(slideIndex += n);
}

function currentSlide(n){
  showSlides(slideIndex = n);
}

function initSlideshow(){
  const prev = document.getElementById("prevSlide");
  const next = document.getElementById("nextSlide");

  if (prev) prev.addEventListener("click", () => plusSlides(-1));
  if (next) next.addEventListener("click", () => plusSlides(1));

  showSlides(slideIndex);
}

  // show first slide by default
  showSlides(slideIndex);

function initScrollLinks(){
  document.querySelectorAll(".scroll-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const target = document.getElementById(targetId);

      // If the target is still hidden (locked), do nothing
      if (!target || target.classList.contains("hidden")) return;

      scrollToSection(target);
    });
  });
}

function initBackToTop(){
  const btn = document.getElementById("backToTop");
  if(!btn) return;

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

function init(){
  playPopups();
  initNav();
  initActiveNav();
  initSlideshow();
  initScrollLinks();
  initBackToTop();
}

init();