import Case from "case";

import aberration from "./Aberration.png";
import artificer from "./Artificer.png";
import barbarian from "./Barbarian.png";
import bard from "./Bard.png";
import beast from "./Beast.png";
import bloodHunter from "./Blood Hunter.png";
import celestial from "./Celestial.png";
import cleric from "./Cleric.png";
import construct from "./Construct.png";
import dragon from "./Dragon.png";
import druid from "./Druid.png";
import elemental from "./Elemental.png";
import fey from "./Fey.png";
import fiend from "./Fiend.png";
import fighter from "./Fighter.png";
import giant from "./Giant.png";
import goblinoid from "./Goblinoid.png";
import humanoid from "./Humanoid.png";
import monk from "./Monk.png";
import monstrosity from "./Monstrosity.png";
import ooze from "./Ooze.png";
import paladin from "./Paladin.png";
import plant from "./Plant.png";
import ranger from "./Ranger.png";
import rogue from "./Rogue.png";
import shapechanger from "./Shapechanger.png";
import sorcerer from "./Sorcerer.png";
import titan from "./Titan.png";
import undead from "./Undead.png";
import warlock from "./Warlock.png";
import wizard from "./Wizard.png";
import unknown from "./Unknown.png";

export const tokenSources = {
  barbarian,
  bard,
  cleric,
  druid,
  fighter,
  monk,
  paladin,
  ranger,
  rogue,
  sorcerer,
  warlock,
  wizard,
  artificer,
  bloodHunter,
  aberration,
  beast,
  celestial,
  construct,
  dragon,
  elemental,
  fey,
  fiend,
  giant,
  goblinoid,
  humanoid,
  monstrosity,
  ooze,
  plant,
  shapechanger,
  titan,
  undead,
};

function getDefaultTokenSize(key) {
  switch (key) {
    case "dragon":
    case "elemental":
    case "giant":
    case "ooze":
    case "titan":
      return 2;
    default:
      return 1;
  }
}

export const tokens = Object.keys(tokenSources).map((key) => ({
  key,
  name: Case.capital(key),
  type: "default",
  defaultSize: getDefaultTokenSize(key),
  defaultLabel: "",
  defaultCategory: "character",
  hideInSidebar: false,
  width: 256,
  height: 256,
}));

export const unknownSource = unknown;
