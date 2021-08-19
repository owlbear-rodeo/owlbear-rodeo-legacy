import { Duration } from "./Timer";
import { DrawingToolSettings } from "./Drawing";
import { FogToolSettings } from "./Fog";
import { PointerToolSettings } from "./Pointer";
import { SelectToolSettings } from "./Select";

export type DrawingSettings = DrawingToolSettings;
export type FogSettings = FogToolSettings & {
  editOpacity: number;
  showGuides: boolean;
};
export type DiceSettings = {
  shareDice: boolean;
  style: string;
};
export type GameSettings = {
  usePassword: boolean;
};
export type MapSettings = {
  fullScreen: boolean;
  labeSize: number;
  gridSnappingSensitivity: number;
};
export type PointerSettings = PointerToolSettings;
export type TimerSettings = Duration;
export type SelectSettings = SelectToolSettings;

export type Settings = {
  dice: DiceSettings;
  drawing: DrawingSettings;
  fog: FogSettings;
  game: GameSettings;
  map: MapSettings;
  pointer: PointerSettings;
  timer: TimerSettings;
  select: SelectSettings;
};
