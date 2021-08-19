import polygonClipping from "polygon-clipping";

import Action from "./Action";
import {
  addPolygonDifferenceToFog,
  addPolygonIntersectionToFog,
  fogToGeometry,
} from "../helpers/actions";

import { Fog, FogState } from "../types/Fog";

class CutFogAction extends Action<FogState> {
  fogs: Fog[];

  constructor(fog: Fog[]) {
    super();
    this.fogs = fog;
  }

  update(fogsById: FogState): FogState {
    let actionGeom = this.fogs.map(fogToGeometry);
    let cutFogs: FogState = {};
    for (let fog of Object.values(fogsById)) {
      const fogGeom = fogToGeometry(fog);
      try {
        const difference = polygonClipping.difference(fogGeom, ...actionGeom);
        const intersection = polygonClipping.intersection(
          fogGeom,
          ...actionGeom
        );
        addPolygonDifferenceToFog(fog, difference, cutFogs);
        addPolygonIntersectionToFog(fog, intersection, cutFogs);
      } catch {
        console.error("Unable to find intersection for fogs");
      }
    }
    return cutFogs;
  }
}

export default CutFogAction;
