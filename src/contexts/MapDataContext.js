import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useDatabase } from "./DatabaseContext";

import { removeGroupsItems } from "../helpers/group";

const MapDataContext = React.createContext();

const defaultMapState = {
  tokens: {},
  drawShapes: {},
  fogShapes: {},
  // Flags to determine what other people can edit
  editFlags: ["drawing", "tokens", "notes"],
  notes: {},
};

export function MapDataProvider({ children }) {
  const { database } = useDatabase();

  const mapsQuery = useLiveQuery(
    () => database?.table("maps").toArray(),
    [database]
  );
  const mapStatesQuery = useLiveQuery(
    () => database?.table("states").toArray(),
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

  const [mapGroups, setMapGroups] = useState([]);
  useEffect(() => {
    async function updateMapGroups() {
      const group = await database.table("groups").get("maps");
      setMapGroups(group.items);
    }
    if (database && mapGroupQuery) {
      updateMapGroups();
    }
  }, [mapGroupQuery, database]);

  const getMap = useCallback(
    async (mapId) => {
      let map = await database.table("maps").get(mapId);
      return map;
    },
    [database]
  );

  const getMapState = useCallback(
    async (mapId) => {
      let mapState = await database.table("states").get(mapId);
      return mapState;
    },
    [database]
  );

  /**
   * Adds a map to the database, also adds an assosiated state and group for that map
   * @param {Object} map map to add
   */
  const addMap = useCallback(
    async (map) => {
      // Just update map database as react state will be updated with an Observable
      const state = { ...defaultMapState, mapId: map.id };
      await database.table("maps").add(map);
      await database.table("states").add(state);
      const group = await database.table("groups").get("maps");
      await database.table("groups").update("maps", {
        items: [{ id: map.id, type: "item" }, ...group.items],
      });
    },
    [database]
  );

  const removeMaps = useCallback(
    async (ids) => {
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
    },
    [database]
  );

  const resetMap = useCallback(
    async (id) => {
      const state = { ...defaultMapState, mapId: id };
      await database.table("states").put(state);
      return state;
    },
    [database]
  );

  const updateMap = useCallback(
    async (id, update) => {
      await database.table("maps").update(id, update);
    },
    [database]
  );

  const updateMapState = useCallback(
    async (id, update) => {
      await database.table("states").update(id, update);
    },
    [database]
  );

  const updateMapGroups = useCallback(
    async (groups) => {
      // Update group state immediately to avoid animation delay
      setMapGroups(groups);
      await database.table("groups").update("maps", { items: groups });
    },
    [database]
  );

  const [mapsById, setMapsById] = useState({});
  useEffect(() => {
    setMapsById(
      maps.reduce((obj, map) => {
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
