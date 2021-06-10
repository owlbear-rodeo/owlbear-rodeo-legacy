import React, { useEffect, useState, useContext, useCallback } from "react";
import { decode } from "@msgpack/msgpack";

import { useAuth } from "./AuthContext";
import { useDatabase } from "./DatabaseContext";

import { applyObservableChange } from "../helpers/dexie";
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
  const { database, databaseStatus, worker } = useDatabase();
  const { userId } = useAuth();

  const [maps, setMaps] = useState([]);
  const [mapStates, setMapStates] = useState([]);
  const [mapsLoading, setMapsLoading] = useState(true);
  const [mapGroups, setMapGroups] = useState([]);

  // Load maps from the database and ensure state is properly setup
  useEffect(() => {
    if (!userId || !database || databaseStatus === "loading") {
      return;
    }

    async function loadMaps() {
      let storedMaps = [];
      // Try to load maps with worker, fallback to database if failed
      const packedMaps = await worker.loadData("maps");
      // let packedMaps;
      if (packedMaps) {
        storedMaps = decode(packedMaps);
      } else {
        console.warn("Unable to load maps with worker, loading may be slow");
        await database.table("maps").each((map) => {
          storedMaps.push(map);
        });
      }
      setMaps(storedMaps);
      const storedStates = await database.table("states").toArray();
      setMapStates(storedStates);
      const group = await database.table("groups").get("maps");
      const storedGroups = group.items;
      setMapGroups(storedGroups);
      setMapsLoading(false);
    }

    loadMaps();
  }, [userId, database, databaseStatus, worker]);

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

  // Create DB observable to sync creating and deleting
  useEffect(() => {
    if (!database || databaseStatus === "loading") {
      return;
    }

    function handleMapChanges(changes) {
      for (let change of changes) {
        if (change.table === "maps") {
          if (change.type === 1) {
            // Created
            const map = change.obj;
            const state = { ...defaultMapState, mapId: map.id };
            setMaps((prevMaps) => [map, ...prevMaps]);
            setMapStates((prevStates) => [state, ...prevStates]);
          } else if (change.type === 2) {
            const map = change.obj;
            setMaps((prevMaps) => {
              const newMaps = [...prevMaps];
              const i = newMaps.findIndex((m) => m.id === map.id);
              if (i > -1) {
                newMaps[i] = map;
              }
              return newMaps;
            });
          } else if (change.type === 3) {
            // Deleted
            const id = change.key;
            setMaps((prevMaps) => {
              const filtered = prevMaps.filter((map) => map.id !== id);
              return filtered;
            });
            setMapStates((prevMapsStates) => {
              const filtered = prevMapsStates.filter(
                (state) => state.mapId !== id
              );
              return filtered;
            });
          }
        }
        if (change.table === "states") {
          if (change.type === 2) {
            // Update map state
            const state = change.obj;
            setMapStates((prevMapStates) => {
              const newStates = [...prevMapStates];
              const i = newStates.findIndex((s) => s.mapId === state.mapId);
              if (i > -1) {
                newStates[i] = state;
              }
              return newStates;
            });
          }
        }
        if (change.table === "groups") {
          if (change.type === 2 && change.key === "maps") {
            const group = applyObservableChange(change);
            const groups = group.items.filter((item) => item !== null);
            setMapGroups(groups);
          }
        }
      }
    }

    database.on("changes", handleMapChanges);

    return () => {
      database.on("changes").unsubscribe(handleMapChanges);
    };
  }, [database, databaseStatus]);

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
