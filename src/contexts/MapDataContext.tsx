import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useDatabase } from "./DatabaseContext";

import { Map } from "../types/Map";
import { MapState } from "../types/MapState";

import { removeGroupsItems } from "../helpers/group";

import { Group } from "../types/Group";

export type AddMapEventHandler = (map: Map) => Promise<void>;
export type RemoveMapsEventHandler = (ids: string[]) => Promise<void>;
export type ResetMapEventHandler = (id: string) => Promise<MapState>;
export type UpdateMapEventHanlder = (
  id: string,
  update: Partial<Map>
) => Promise<void>;
export type UpdateMapStateEventHandler = (
  id: string,
  update: Partial<MapState>
) => Promise<void>;
export type GetMapStateEventHandler = (
  id: string
) => Promise<MapState | undefined>;
export type GetMapEventHandler = (id: string) => Promise<Map | undefined>;
export type UpdateMapGroupsEventHandler = (groups: Group[]) => Promise<void>;

type MapDataContextValue = {
  maps: Array<Map>;
  mapStates: MapState[];
  /** Adds a map to the database, also adds an assosiated state and group for that map */
  addMap: AddMapEventHandler;
  removeMaps: RemoveMapsEventHandler;
  resetMap: ResetMapEventHandler;
  updateMap: UpdateMapEventHanlder;
  updateMapState: UpdateMapStateEventHandler;
  getMapState: GetMapStateEventHandler;
  getMap: GetMapEventHandler;
  mapsLoading: boolean;
  updateMapGroups: UpdateMapGroupsEventHandler;
  mapsById: Record<string, Map>;
  mapGroups: Group[];
};

const MapDataContext =
  React.createContext<MapDataContextValue | undefined>(undefined);

const defaultMapState: Omit<MapState, "mapId"> = {
  tokens: {},
  drawShapes: {},
  fogShapes: {},
  // Flags to determine what other people can edit
  editFlags: ["drawing", "tokens", "notes", "fog"],
  notes: {},
};

export function MapDataProvider({ children }: { children: React.ReactNode }) {
  const { database } = useDatabase();

  const mapsQuery = useLiveQuery<Map[]>(
    () => database?.table("maps").toArray() || [],
    [database]
  );
  const mapStatesQuery = useLiveQuery<MapState[]>(
    () => database?.table("states").toArray() || [],
    [database]
  );

  const maps = useMemo(() => mapsQuery || [], [mapsQuery]);
  const mapStates = useMemo(() => mapStatesQuery || [], [mapStatesQuery]);
  const mapsLoading = useMemo(
    () => !mapsQuery || !mapStatesQuery,
    [mapsQuery, mapStatesQuery]
  );

  const mapGroupQuery = useLiveQuery(
    () => database?.table("groups").get("maps"),
    [database]
  );

  const [mapGroups, setMapGroups] = useState<Group[]>([]);
  useEffect(() => {
    async function updateMapGroups() {
      const group = await database?.table("groups").get("maps");
      setMapGroups(group.items);
    }
    if (database && mapGroupQuery) {
      updateMapGroups();
    }
  }, [mapGroupQuery, database]);

  const getMap = useCallback<GetMapEventHandler>(
    async (mapId) => {
      let map = await database?.table("maps").get(mapId);
      return map;
    },
    [database]
  );

  const getMapState = useCallback<GetMapStateEventHandler>(
    async (mapId) => {
      let mapState = await database?.table("states").get(mapId);
      return mapState;
    },
    [database]
  );

  const addMap = useCallback<AddMapEventHandler>(
    async (map) => {
      if (database) {
        // Just update map database as react state will be updated with an Observable
        const state = { ...defaultMapState, mapId: map.id };
        await database.table("maps").add(map);
        await database.table("states").add(state);
        const group = await database.table("groups").get("maps");
        await database.table("groups").update("maps", {
          items: [{ id: map.id, type: "item" }, ...group.items],
        });
      }
    },
    [database]
  );

  const removeMaps = useCallback<RemoveMapsEventHandler>(
    async (ids) => {
      if (database) {
        const maps = await database.table("maps").bulkGet(ids);
        // Remove assets linked with maps
        let assetIds = [];
        for (let map of maps) {
          if (map.type === "file") {
            assetIds.push(map.file);
            assetIds.push(map.thumbnail);
            for (let res of Object.values(map.resolutions)) {
              assetIds.push(res);
            }
          }
        }

        const group = await database.table("groups").get("maps");
        let items = removeGroupsItems(group.items, ids);
        await database.table("groups").update("maps", { items });

        await database.table("maps").bulkDelete(ids);
        await database.table("states").bulkDelete(ids);
        await database.table("assets").bulkDelete(assetIds);
      }
    },
    [database]
  );

  const resetMap = useCallback<ResetMapEventHandler>(
    async (id) => {
      const state: MapState = { ...defaultMapState, mapId: id };
      await database?.table("states").put(state);
      return state;
    },
    [database]
  );

  const updateMap = useCallback<UpdateMapEventHanlder>(
    async (id, update) => {
      await database?.table("maps").update(id, update);
    },
    [database]
  );

  const updateMapState = useCallback<UpdateMapStateEventHandler>(
    async (id, update) => {
      await database?.table("states").update(id, update);
    },
    [database]
  );

  const updateMapGroups = useCallback<UpdateMapGroupsEventHandler>(
    async (groups) => {
      // Update group state immediately to avoid animation delay
      setMapGroups(groups);
      await database?.table("groups").update("maps", { items: groups });
    },
    [database]
  );

  const [mapsById, setMapsById] = useState<Record<string, Map>>({});
  useEffect(() => {
    setMapsById(
      maps.reduce((obj: Record<string, Map>, map) => {
        obj[map.id] = map;
        return obj;
      }, {})
    );
  }, [maps]);

  const value = {
    maps,
    mapStates,
    mapGroups,
    addMap,
    removeMaps,
    resetMap,
    updateMap,
    updateMapState,
    getMap,
    mapsLoading,
    getMapState,
    updateMapGroups,
    mapsById,
  };
  return (
    <MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
  );
}

export function useMapData() {
  const context = useContext(MapDataContext);
  if (context === undefined) {
    throw new Error("useMapData must be used within a MapDataProvider");
  }
  return context;
}

export default MapDataContext;
