import Case from "case";

import GalaxyDice from "./galaxy/GalaxyDice";
import IronDice from "./iron/IronDice";
import NebulaDice from "./nebula/NebulaDice";
import SunriseDice from "./sunrise/SunriseDice";
import SunsetDice from "./sunset/SunsetDice";
import WalnutDice from "./walnut/WalnutDice";
import GlassDice from "./glass/GlassDice";
import GemstoneDice from "./gemstone/GemstoneDice";

import GalaxyPreview from "./galaxy/preview.png";
import IronPreview from "./iron/preview.png";
import NebulaPreview from "./nebula/preview.png";
import SunrisePreview from "./sunrise/preview.png";
import SunsetPreview from "./sunset/preview.png";
import WalnutPreview from "./walnut/preview.png";
import GlassPreview from "./glass/preview.png";
import GemstonePreview from "./gemstone/preview.png";

export const diceClasses = {
  galaxy: GalaxyDice,
  nebula: NebulaDice,
  sunrise: SunriseDice,
  sunset: SunsetDice,
  iron: IronDice,
  walnut: WalnutDice,
  glass: GlassDice,
  gemstone: GemstoneDice,
};

export const dicePreviews = {
  galaxy: GalaxyPreview,
  nebula: NebulaPreview,
  sunrise: SunrisePreview,
  sunset: SunsetPreview,
  iron: IronPreview,
  walnut: WalnutPreview,
  glass: GlassPreview,
  gemstone: GemstonePreview,
};

export const dice = Object.keys(diceClasses).map((key) => ({
  key,
  name: Case.capital(key),
  class: diceClasses[key],
  preview: dicePreviews[key],
}));
