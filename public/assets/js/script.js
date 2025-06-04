async function getSkills() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  //Fetch the data from my api, saved from the backend, looking for the username that was input at index unnder ID username
  const res = await fetch(`/api/skills/${username}`);
  const { skills, skillsData } = await res.json();  

  //Create the progress object
  const skillProgress = {};

  //Loop and calculate current level for each skill
  for (const [skillName, currentXp] of Object.entries(skills)) {
    const skillInfo = skillsData[skillName];
    if (!skillInfo || !skillInfo.levels) {
      console.warn(`No skill data found for "${skillName}". Skipping.`);
      continue;
    }

    const levels = skillInfo.levels;
    let level = 0;

    for (const levelInfo of levels) {
      if (currentXp >= levelInfo.totalExpRequired) {
        level = levelInfo.level;
      } else {
        break;
      }
    }

    skillProgress[skillName] = { level };
  }
  
  //Put the data on console just in case
  console.log("skills:", skills);
  console.log("skillsData:", skillsData);
  console.log("skillProgress:", skillProgress)

  displaySkills(skillProgress, skills, skillsData);
}

function displaySkills(skillProgress, skillsRaw, skillsData) {
  //Empty the container when reloading the display
  const container = document.getElementById("skills-container");
  container.innerHTML = "";

  //Set the colors for the display of each different skill
  const skillColors = {
    Farming: "green",
    Mining: "gray",
    Combat: "red",
    Foraging: "yellow",
    Fishing: "cyan",
    Enchanting: "blue",
    Alchemy: "pink",
    Taming: "darkgreen",
    RuneCrafting: "purple",   
    Carpentry: "burlywood",      
    Social: "orange"           
  };

  for (const [skillKey, info] of Object.entries(skillProgress)) {
    //Make sure my data is all fine and dandy
    const skillInfo = skillsData[skillKey];
    if (!skillInfo || !skillInfo.levels) {
      console.warn(`No skill data for "${skillKey}" — skipping in display.`);
      continue;
    }

    //
    const displayName = skillsData[skillKey]?.name || skillKey;
    const currentXp = skillsRaw[skillKey];
    const levels = skillInfo.levels;

    // Fallback for level 0
    let currentLevelInfo = levels.find(lvl => lvl.level === info.level);
    if (info.level === 0 && (!currentLevelInfo || currentLevelInfo.level !== 0)) {
      currentLevelInfo = { level: 0, totalExpRequired: 0 };
    }


    let nextLevelInfo = levels.find(lvl => lvl.level === info.level + 1);

    let progress = 100;
    let xpText = "MAX LEVEL";
    let tooltip = "Max level reached!";

    if (nextLevelInfo && currentLevelInfo) {
      const xpThisLevel = nextLevelInfo.totalExpRequired - currentLevelInfo.totalExpRequired;
      const xpProgress = currentXp - currentLevelInfo.totalExpRequired;
      progress = Math.min((xpProgress / xpThisLevel) * 100, 100);
      xpText = `${Math.floor(xpProgress).toLocaleString()} / ${Math.floor(xpThisLevel).toLocaleString()} XP`;
      tooltip = nextLevelInfo.unlocks?.join(" | ") || "No unlock info";
    }

    const skillColor = skillColors[skillKey] || "primary";

    const card = document.createElement("div");
    card.className = "col-md-4 mb-4";

    card.innerHTML = `
      <div class="card text-bg-dark h-100 shadow" style="border: 2px solid ${skillColor};">
        <div class="card-body">
          <h5 class="card-title">${displayName}</h5>
          <p class="card-text mb-1">Level: ${info.level}, ${progress.toFixed(1)}%</p>
          <div class="progress mb-2" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip}">
            <div class="progress-bar bg-success" style="width: ${progress}%;">
            </div>
          </div>
          <small class="text-light">${xpText}</small>
        </div>
      </div>`
    ;

    container.appendChild(card);
  }

  // Activate Bootstrap tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].forEach(el => new bootstrap.Tooltip(el));
}