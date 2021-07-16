import polygonClipping from "polygon-clipping";

import Action from "./Action";
import { addPolygonDifferenceToFog, fogToGeometry } from "../helpers/actions";

import { Fog, FogState } from "../types/Fog";

class SubtractFogAction extends Action<FogState> {
  fogs: Fog[];

  constructor(fogs: Fog[]) {
    super();
    this.fogs = fogs;
  }

  update(fogsById: FogState): FogState {
    const actionGeom = this.fogs.map(fogToGeometry);
    let subtractedFogs: FogState = {};
    for (let fog of Object.values(fogsById)) {
      const fogGeom = fogToGeometry(fog);
      try {
        const difference = polygonClipping.difference(fogGeom, ...actionGeom);
        addPolygonDifferenceToFog(fog, difference, subtractedFogs);
      } catch {
        console.error("Unable to find difference for fogs");
      }
    }
    return subtractedFogs;
  }
}

export default SubtractFogAction;
