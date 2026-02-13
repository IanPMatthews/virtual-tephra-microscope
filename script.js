const slide = document.getElementById("slide");
const viewer = document.getElementById("viewer");
const statusText = document.getElementById("statusText");

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let isDragging = false;
let hasDragged = false;
let startX, startY;
const dragThreshold = 5;

let exerciseMode = "single";
let totalShards = 0;
let foundShards = 0;

let stratSlides = ["vedde", "laacher_see", "basalts", "vesicular", "diatoms"];
let currentStratIndex = 0;

/* ------------------ IMAGE FILE MAP ------------------ */
/* You can extend numbers as needed */

const slideImages = {
  vedde: generateImageList(82),
  laacher_see: generateImageList(95),
  basalts: generateImageList(69),
  vesicular: generateImageList(100),
  diatoms: generateImageList(100)
};

function generateImageList(n) {
  let arr = [];
  for (let i = 1; i <= n; i++) {
    arr.push(i + ".jpg");
  }
  return arr;
}

/* ------------------ START EXERCISE ------------------ */

function startExercise() {
  exerciseMode = document.getElementById("modeSelect").value;

  resetView();

  if (exerciseMode === "single") {
    const folder = document.getElementById("slideSelect").value;
    loadSlide(folder);
  } else {
    currentStratIndex = 0;
    loadSlide(stratSlides[currentStratIndex]);
  }
}

/* ------------------ LOAD SLIDE ------------------ */

function loadSlide(folder) {
  slide.innerHTML = "";
  foundShards = 0;

  const images = slideImages[folder];
  totalShards = images.length;

  images.forEach(file => {
    const img = document.createElement("img");
    img.src = `images/${folder}/${file}`;
    img.className = "shard";

    img.style.left = Math.random() * 2000 + "px";
    img.style.top = Math.random() * 1200 + "px";
    img.style.width = 80 + "px";

    img.addEventListener("click", handleShardClick);

    slide.appendChild(img);
  });

  if (exerciseMode === "single") {
    statusText.textContent = `Found 0 of ${totalShards} shards`;
  } else {
    statusText.textContent =
      `Slide ${currentStratIndex + 1} of ${stratSlides.length}`;
  }
}

/* ------------------ CLICK HANDLER ------------------ */

function handleShardClick(e) {
  if (hasDragged) return;

  if (!this.classList.contains("found")) {
    this.classList.add("found");
    foundShards++;

    if (exerciseMode === "single") {
      if (foundShards === totalShards) {
        statusText.textContent = "🎉 Slide Complete!";
      } else {
        statusText.textContent =
          `Found ${foundShards} of ${totalShards} shards`;
      }
    }
  }
}

/* ------------------ ZOOM ------------------ */

viewer.addEventListener("wheel", function (e) {
  e.preventDefault();

  const rect = viewer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomAmount = 0.1;
  const direction = e.deltaY > 0 ? -1 : 1;
  const newScale = scale + direction * zoomAmount;

  if (newScale < 0.5 || newScale > 4) return;

  const scaleRatio = newScale / scale;

  offsetX = mouseX - (mouseX - offsetX) * scaleRatio;
  offsetY = mouseY - (mouseY - offsetY) * scaleRatio;

  scale = newScale;

  updateTransform();
});

/* ------------------ PAN ------------------ */

viewer.addEventListener("mousedown", (e) => {
  isDragging = true;
  hasDragged = false;
  startX = e.clientX;
  startY = e.clientY;
  viewer.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
    hasDragged = true;
  }

  offsetX += dx;
  offsetY += dy;

  startX = e.clientX;
  startY = e.clientY;

  updateTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  viewer.style.cursor = "grab";
});

/* ------------------ UPDATE TRANSFORM ------------------ */

function updateTransform() {
  slide.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

/* ------------------ RESET VIEW ------------------ */

function resetView() {
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  updateTransform();
}
