const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

const API_KEY = "0099d5cc-a376-4718-bf18-d15875b1abd0";

app.use(express.static('public'));

// Fetch skill data from the Hypixel API
const fetchSkills = async () => {
  const res = await fetch('https://api.hypixel.net/v2/resources/skyblock/skills');
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch skill data");
  const skills = data.skills;
  const skillLevelInfo = { 
    Farming: skills.FARMING || 0,
    Mining: skills.MINING || 0,
    Combat: skills.COMBAT || 0,
    Foraging: skills.FORAGING || 0,
    Fishing: skills.FISHING || 0,
    Enchanting: skills.ENCHANTING || 0,
    Alchemy: skills.ALCHEMY || 0,
    Taming: skills.TAMING || 0,
    RuneCrafting: skills.RUNECRAFTING || 0,
    Carpentry: skills.CARPENTRY || 0,
    Social: skills.SOCIAL || 0,
  }
  return skillLevelInfo;
};

// Fetch profile data and combine it with skills data
app.get('/api/skills/:username', async (req, res) => {
  const username = req.params.username;

  try {
    // Step 1: Get UUID from Mojang
    const mojangRes = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
    if (!mojangRes.ok) throw new Error("Player not found");
    const mojangData = await mojangRes.json();
    const uuid = mojangData.id;

    // Step 2: Get Skyblock profiles from Hypixel
    const hypixelRes = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${API_KEY}&uuid=${uuid}`);
    const hypixelData = await hypixelRes.json();
    if (!hypixelData.success) throw new Error(hypixelData.cause || "Hypixel API failed");

    // Step 3: Fetch active profile
    const profiles = hypixelData.profiles;
    const activeProfile = profiles.find(p => p.selected);
    if (!activeProfile) throw new Error("No active profile found");

    const member = activeProfile.members[uuid];
    
    const experience = member.player_data?.experience;
    if (!experience) {
      throw new Error("Experience data is missing");
    }

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

    const skillsData = await fetchSkills();

    // Return the combined data (skills and profile)
    res.json({ skills, skillsData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
