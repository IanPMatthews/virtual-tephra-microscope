// ================= CONFIG =================

const slide = document.getElementById("slide");
const viewport = document.getElementById("viewport");

const slideWidth = 2400;

const IMAGE_COUNTS = {
  vedde: 82,
  laacher_see: 95,
  basalts: 69,
  vesicular: 100,
  diatoms: 100,
  non_tephra: 100
};

const folderMap = {
  vedde: "vedde",
  laacher_see: "laacher_see",
  basalts: "basalts",
  vesicular: "vesicular",
  diatoms: "diatoms",
  non_tephra: "non_tephra"
};

const EXERCISES = {
  vedde: { composition: { vedde:30, diatoms:30, non_tephra:30 }},
  laacher: { composition: { laacher_see:30, diatoms:30, non_tephra:30 }},
  basalt: { composition: { basalts:30, diatoms:30, non_tephra:30 }},
  hekla: { composition: { vesicular:30, diatoms:30, non_tephra:30 }},
  mixed: {
    composition: {
      vedde:10, laacher_see:10,
      basalts:5, vesicular:10,
      diatoms:30, non_tephra:30
    }
  }
};

const STRAT_EXERCISE = {
  tephraCounts: [0,0,2,35,15,11,5,2,3,1,1,0,0,1,0],
  totalObjectsPerSlide: 100
};

// ================= STATE =================

let objects = [];
let stats = {};
let stratSlideIndex = 0;
let stratStats = [];
let chartInstance = null;

// ================= UTILITIES =================

function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

function getRandomImage(category){
  const count=IMAGE_COUNTS[category];
  const index=Math.floor(Math.random()*count)+1;
  const padded=String(index).padStart(3,"0");
  return `images/${folderMap[category]}/${padded}.jpg`;
}

function isTephra(type){
  return ["vedde","laacher_see","basalts","vesicular"].includes(type);
}

function getGridPosition(index){
  const cellSize=180;
  const objectSize=140;
  const columns=Math.floor(slideWidth/cellSize);

  const row=Math.floor(index/columns);
  const col=index%columns;

  const jitterX=Math.random()*(cellSize-objectSize);
  const jitterY=Math.random()*(cellSize-objectSize);

  return { x:col*cellSize+jitterX, y:row*cellSize+jitterY };
}

function styleShard(img){
  const rotation=Math.random()*360;
  const scale=0.9+Math.random()*0.2;
  img.style.transform=`rotate(${rotation}deg) scale(${scale})`;
}

// ================= ZOOM & PAN (FIXED) =================

let scale=1;
let originX=0, originY=0;
let isDragging=false;
let hasMoved=false;
let startX,startY;

viewport.addEventListener("wheel",function(e){
  e.preventDefault();
  const rect=viewport.getBoundingClientRect();
  const mouseX=e.clientX-rect.left;
  const mouseY=e.clientY-rect.top;

  const zoomIntensity=0.1;
  const direction=e.deltaY<0?1:-1;
  const newScale=Math.min(Math.max(0.5,scale+direction*zoomIntensity),4);

  originX-=(mouseX-originX)*(newScale/scale-1);
  originY-=(mouseY-originY)*(newScale/scale-1);

  scale=newScale;
  updateTransform();
});

viewport.addEventListener("mousedown",function(e){
  isDragging=true;
  hasMoved=false;
  startX=e.clientX-originX;
  startY=e.clientY-originY;
});

viewport.addEventListener("mousemove",function(e){
  if(!isDragging) return;

  const newX=e.clientX-startX;
  const newY=e.clientY-startY;

  if (Math.abs(newX-originX)>5 || Math.abs(newY-originY)>5){
    hasMoved=true;
  }

  originX=newX;
  originY=newY;

  updateTransform();
});

viewport.addEventListener("mouseup",()=>isDragging=false);
viewport.addEventListener("mouseleave",()=>isDragging=false);

function updateTransform(){
  slide.style.transform=`translate(${originX}px,${originY}px) scale(${scale})`;
}

function resetView(){
  scale=1;
  originX=0;
  originY=0;
  updateTransform();
}

// ================= CLEAR SLIDE =================

function clearSlide() {
  while (slide.firstChild) {
    const img = slide.firstChild;
    if (img.tagName === "IMG") {
      img.src = "";
      img.onload = null;
      img.onerror = null;
    }
    slide.removeChild(img);
  }

  objects = [];
  stats = {correct:0,falsePositive:0,totalTephra:0};
  resetView();
}

// ================= SINGLE SLIDE =================

function startExercise(type){
  document.getElementById("resultsSection").style.display="none";
  generateSlide(type);
}

function generateSlide(type){
  clearSlide();

  const config=EXERCISES[type];
  let objectTypes=[];

  for(let category in config.composition){
    for(let i=0;i<config.composition[category];i++){
      objectTypes.push(category);
    }
  }

  shuffleArray(objectTypes);

  objectTypes.forEach((category,index)=>{
    const img=new Image();
    img.src=getRandomImage(category);
    img.className="object";
    img.style.position="absolute";
    img.style.opacity=0;
    img.loading="eager";

    const pos=getGridPosition(index);
    img.style.left=pos.x+"px";
    img.style.top=pos.y+"px";

    styleShard(img);
    slide.appendChild(img);

    const obj={trueType:category,element:img,clicked:false};

    img.onload=function(){
      img.style.transition="opacity 0.3s";
      img.style.opacity=1;
    };

    img.onclick=(e)=>{
      if(hasMoved) return;
      if(obj.clicked) return;
      obj.clicked=true;

      if(isTephra(obj.trueType)){
        stats.correct++;
        img.style.outline="3px solid green";
      } else {
        stats.falsePositive++;
        img.style.outline="3px solid red";
      }

      updateScore();
      checkCompletion();
    };

    objects.push(obj);
  });

  stats.totalTephra=objects.filter(o=>isTephra(o.trueType)).length;

  document.getElementById("slideIndicator").innerText =
    `True tephra shards: ${stats.totalTephra}`;

  updateScore();
}

function updateScore(){
  document.getElementById("score").innerText =
    `Correct: ${stats.correct} | False positives: ${stats.falsePositive}`;
}

function checkCompletion(){
  const clicked=objects.filter(o=>o.clicked).length;
  if(clicked===objects.length){
    const accuracy=Math.round((stats.correct/stats.totalTephra)*100);
    document.getElementById("slideIndicator").innerText =
      `Exercise Complete — Accuracy: ${accuracy}%`;
  }
}

// ================= STRAT =================

function startStratExercise(){
  stratSlideIndex=0;
  stratStats=[];
  document.getElementById("resultsSection").style.display="none";
  generateStratSlide();
}

function generateStratSlide(){
  clearSlide();

  const trueCount=STRAT_EXERCISE.tephraCounts[stratSlideIndex];
  const total=STRAT_EXERCISE.totalObjectsPerSlide;

  stratStats[stratSlideIndex]={trueCount,correct:0,falsePositive:0};

  let objectTypes=[];

  for(let i=0;i<trueCount;i++){
    objectTypes.push(["vedde","laacher_see","basalts","vesicular"][Math.floor(Math.random()*4)]);
  }

  for(let i=trueCount;i<total;i++){
    objectTypes.push(Math.random()<0.5?"diatoms":"non_tephra");
  }

  shuffleArray(objectTypes);

  document.getElementById("slideIndicator").innerText =
    `Slide ${stratSlideIndex+1} of ${STRAT_EXERCISE.tephraCounts.length}`;

  objectTypes.forEach((category,index)=>{
    const img=new Image();
    img.src=getRandomImage(category);
    img.className="object";
    img.style.position="absolute";
    img.style.opacity=0;
    img.loading="eager";

    const pos=getGridPosition(index);
    img.style.left=pos.x+"px";
    img.style.top=pos.y+"px";

    styleShard(img);
    slide.appendChild(img);

    img.onload=function(){
      img.style.transition="opacity 0.3s";
      img.style.opacity=1;
    };

    img.onclick=()=>{
      if(hasMoved) return;
      if(img.dataset.clicked) return;
      img.dataset.clicked=true;

      if(isTephra(category)){
        stratStats[stratSlideIndex].correct++;
        img.style.outline="3px solid green";
      } else {
        stratStats[stratSlideIndex].falsePositive++;
        img.style.outline="3px solid red";
      }
    };
  });
}

function nextStratSlide(){
  if(stratSlideIndex<STRAT_EXERCISE.tephraCounts.length-1){
    stratSlideIndex++;
    generateStratSlide();
  } else {
    showResults();
  }
}

function showResults(){
  document.getElementById("resultsSection").style.display="block";

const tableBody=document.getElementById("resultsTable");
  tableBody.innerHTML="";

  stratStats.forEach((slide,index)=>{
    const row=document.createElement("tr");
    row.innerHTML=`
      <td>${index+1}</td>
      <td>${slide.trueCount}</td>
      <td>${slide.correct}</td>
      <td>${slide.falsePositive}</td>
    `;
    tableBody.appendChild(row);
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx=document.getElementById("resultsChart").getContext("2d");

  chartInstance = new Chart(ctx,{
    type:"bar",
    data:{
      labels:stratStats.map((_,i)=>`Slide ${i+1}`),
      datasets:[
        { label:"True Tephra", data:stratStats.map(s=>s.trueCount) },
        { label:"Correct Identified", data:stratStats.map(s=>s.correct) }
      ]
    }
  });
}

