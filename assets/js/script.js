async function getSkills() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  try {
    // Step 1: Get UUID from playerdb.co (supports CORS)
    const mojangRes = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
    const mojangData = await mojangRes.json();
    const uuid = mojangData.data.player.raw_id;

    // Step 2: Get Skyblock profiles from Hypixel API (CORS is allowed)
    const API_KEY = "60fa9e81-1961-457e-9e4b-881c40f0f2c1";
    const hypixelRes = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${API_KEY}&uuid=${uuid}`);
    const hypixelData = await hypixelRes.json();
    if (!hypixelData.success) throw new Error(hypixelData.cause || "Hypixel API failed");

    // Step 3: Extract the active profile
    const profiles = hypixelData.profiles;
    const activeProfile = profiles.find(p => p.selected);
    if (!activeProfile) throw new Error("No active profile found");
    const member = activeProfile.members[uuid];

    const experience = member.player_data?.experience;
    if (!experience) throw new Error("Experience data is missing");

    const skills = {
      Farming: experience.SKILL_FARMING || 0,
      Mining: experience.SKILL_MINING || 0,
      Combat: experience.SKILL_COMBAT || 0,
      Foraging: experience.SKILL_FORAGING || 0,
      Fishing: experience.SKILL_FISHING || 0,
      Enchanting: experience.SKILL_ENCHANTING || 0,
      Alchemy: experience.SKILL_ALCHEMY || 0,
      Taming: experience.SKILL_TAMING || 0,
      RuneCrafting: experience.SKILL_RUNECRAFTING || 0,
      Carpentry: experience.SKILL_CARPENTRY || 0,
      Social: experience.SKILL_SOCIAL || 0,
    };

    // Step 4: Get skill XP requirements
    const skillsRes = await fetch('https://api.hypixel.net/v2/resources/skyblock/skills');
    const skillsJson = await skillsRes.json();
    if (!skillsJson.success) throw new Error("Failed to fetch skill XP data");
    const rawSkills = skillsJson.skills;

    const skillsData = {
      Farming: rawSkills.FARMING,
      Mining: rawSkills.MINING,
      Combat: rawSkills.COMBAT,
      Foraging: rawSkills.FORAGING,
      Fishing: rawSkills.FISHING,
      Enchanting: rawSkills.ENCHANTING,
      Alchemy: rawSkills.ALCHEMY,
      Taming: rawSkills.TAMING,
      RuneCrafting: rawSkills.RUNECRAFTING,
      Carpentry: rawSkills.CARPENTRY,
      Social: rawSkills.SOCIAL,
    };

    // Step 5: Calculate levels
    const skillProgress = {};
    for (const [skillName, currentXp] of Object.entries(skills)) {
      const skillInfo = skillsData[skillName];
      if (!skillInfo || !skillInfo.levels) continue;
      const levels = skillInfo.levels;
      let level = 0;
      for (const levelInfo of levels) {
        if (currentXp >= levelInfo.totalExpRequired) level = levelInfo.level;
        else break;
      }
      skillProgress[skillName] = { level };
    }

    // Logging for debug
    console.log("skills:", skills);
    console.log("skillsData:", skillsData);
    console.log("skillProgress:", skillProgress);

    displaySkills(skillProgress, skills, skillsData);
  } catch (error) {
    console.error("Failed to load skills:", error);
    alert(`Error: ${error.message}`);
  }
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