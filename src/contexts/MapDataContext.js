import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { decode } from "@msgpack/msgpack";

import { useAuth } from "./AuthContext";
import { useDatabase } from "./DatabaseContext";

import { maps as defaultMaps } from "../maps";

const MapDataContext = React.createContext();

// Maximum number of maps to keep in the cache
const cachedMapMax = 15;

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

  // Load maps from the database and ensure state is properly setup
  useEffect(() => {
    if (!userId || !database || databaseStatus === "loading") {
      return;
    }
    async function getDefaultMaps() {
      const defaultMapsWithIds = [];
      for (let i = 0; i < defaultMaps.length; i++) {
        const defaultMap = defaultMaps[i];
        const id = `__default-${defaultMap.name}`;
        defaultMapsWithIds.push({
          ...defaultMap,
          id,
          owner: userId,
          // Emulate the time increasing to avoid sort errors
          created: Date.now() + i,
          lastModified: Date.now() + i,
          showGrid: false,
          snapToGrid: true,
          group: "default",
        });
        // Add a state for the map if there isn't one already
        const state = await database.table("states").get(id);
        if (!state) {
          await database.table("states").add({ ...defaultMapState, mapId: id });
        }
      }
      return defaultMapsWithIds;
    }

    // Loads maps without the file data to save memory
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
          const { file, resolutions, ...rest } = map;
          storedMaps.push(rest);
        });
      }
      const sortedMaps = storedMaps.sort((a, b) => b.created - a.created);
      const defaultMapsWithIds = await getDefaultMaps();
      const allMaps = [...sortedMaps, ...defaultMapsWithIds];
      setMaps(allMaps);
      const storedStates = await database.table("states").toArray();
      setMapStates(storedStates);
      setMapsLoading(false);
    }

    loadMaps();
  }, [userId, database, databaseStatus, worker]);

  const mapsRef = useRef(maps);
  useEffect(() => {
    mapsRef.current = maps;
  }, [maps]);

  const getMap = useCallback((mapId) => {
    return mapsRef.current.find((map) => map.id === mapId);
  }, []);

  const getMapFromDB = useCallback(
    async (mapId) => {
      let map = await database.table("maps").get(mapId);
      return map;
    },
    [database]
  );

  const getMapStateFromDB = useCallback(
    async (mapId) => {
      let mapState = await database.table("states").get(mapId);
      return mapState;
    },
    [database]
  );

  /**
   * Keep up to cachedMapMax amount of maps that you don't own
   * Sorted by when they we're last used
   */
  const updateCache = useCallback(async () => {
    const cachedMaps = await database
      .table("maps")
      .where("owner")
      .notEqual(userId)
      .sortBy("lastUsed");
    if (cachedMaps.length > cachedMapMax) {
      const cacheDeleteCount = cachedMaps.length - cachedMapMax;
      const idsToDelete = cachedMaps
        .slice(0, cacheDeleteCount)
        .map((map) => map.id);
      database.table("maps").where("id").anyOf(idsToDelete).delete();
    }
  }, [database, userId]);

  /**
   * Adds a map to the database, also adds an assosiated state for that map
   * @param {Object} map map to add
   */
  const addMap = useCallback(
    async (map) => {
      // Just update map database as react state will be updated with an Observable
      const state = { ...defaultMapState, mapId: map.id };
      await database.table("maps").add(map);
      await database.table("states").add(state);
      if (map.owner !== userId) {
        await updateCache();
      }
    },
    [database, updateCache, userId]
  );

  const removeMap = useCallback(
    async (id) => {
      await database.table("maps").delete(id);
      await database.table("states").delete(id);
    },
    [database]
  );

  const removeMaps = useCallback(
    async (ids) => {
      await database.table("maps").bulkDelete(ids);
      await database.table("states").bulkDelete(ids);
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
      // fake-indexeddb throws an error when updating maps in production.
      // Catch that error and use put when it fails
      try {
        await database.table("maps").update(id, update);
      } catch (error) {
        const map = (await getMapFromDB(id)) || {};
        await database.table("maps").put({ ...map, id, ...update });
      }
    },
    [database, getMapFromDB]
  );

  const updateMaps = useCallback(
    async (ids, update) => {
      await Promise.all(
        ids.map((id) => database.table("maps").update(id, update))
      );
    },
    [database]
  );

  const updateMapState = useCallback(
    async (id, update) => {
      await database.table("states").update(id, update);
    },
    [database]
  );

  /**
   * Adds a map to the database if none exists or replaces a map if it already exists
   * Note: this does not add a map state to do that use AddMap
   * @param {Object} map the map to put
   */
  const putMap = useCallback(
    async (map) => {
      await database.table("maps").put(map);
      if (map.owner !== userId) {
        await updateCache();
      }
    },
    [database, updateCache, userId]
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
      }
    }

    database.on("changes", handleMapChanges);

    return () => {
      database.on("changes").unsubscribe(handleMapChanges);
    };
  }, [database, databaseStatus]);

  const ownedMaps = maps.filter((map) => map.owner === userId);

  const value = {
    maps,
    ownedMaps,
    mapStates,
    addMap,
    removeMap,
    removeMaps,
    resetMap,
    updateMap,
    updateMaps,
    updateMapState,
    putMap,
    getMap,
    getMapFromDB,
    mapsLoading,
    getMapStateFromDB,
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
