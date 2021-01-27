import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import * as Comlink from "comlink";
import { decode } from "@msgpack/msgpack";

import AuthContext from "./AuthContext";
import DatabaseContext from "./DatabaseContext";

import DatabaseWorker from "worker-loader!../workers/DatabaseWorker"; // eslint-disable-line import/no-webpack-loader-syntax

import { maps as defaultMaps } from "../maps";

const MapDataContext = React.createContext();

// Maximum number of maps to keep in the cache
const cachedMapMax = 15;

const defaultMapState = {
  tokens: {},
  // An index into the draw actions array to which only actions before the
  // index will be performed (used in undo and redo)
  mapDrawActionIndex: -1,
  mapDrawActions: [],
  fogDrawActionIndex: -1,
  fogDrawActions: [],
  // Flags to determine what other people can edit
  editFlags: ["drawing", "tokens", "notes"],
  notes: {},
};

const worker = Comlink.wrap(new DatabaseWorker());

export function MapDataProvider({ children }) {
  const { database, databaseStatus } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);

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

    async function loadMaps() {
      let storedMaps = [];
      // Try to load maps with worker, fallback to database if failed
      const packedMaps = await worker.loadData("maps");
      if (packedMaps) {
        storedMaps = decode(packedMaps);
      } else {
        console.warn("Unable to load maps with worker, loading may be slow");
        await database.table("maps").each((map) => storedMaps.push(map));
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
  }, [userId, database, databaseStatus]);

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
      setMaps((prevMaps) => {
        return prevMaps.filter((map) => !idsToDelete.includes(map.id));
      });
    }
  }, [database, userId]);

  /**
   * Adds a map to the database, also adds an assosiated state for that map
   * @param {Object} map map to add
   */
  const addMap = useCallback(
    async (map) => {
      await database.table("maps").add(map);
      const state = { ...defaultMapState, mapId: map.id };
      await database.table("states").add(state);
      setMaps((prevMaps) => [map, ...prevMaps]);
      setMapStates((prevStates) => [state, ...prevStates]);
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
      setMaps((prevMaps) => {
        const filtered = prevMaps.filter((map) => map.id !== id);
        return filtered;
      });
      setMapStates((prevMapsStates) => {
        const filtered = prevMapsStates.filter((state) => state.mapId !== id);
        return filtered;
      });
    },
    [database]
  );

  const removeMaps = useCallback(
    async (ids) => {
      await database.table("maps").bulkDelete(ids);
      await database.table("states").bulkDelete(ids);
      setMaps((prevMaps) => {
        const filtered = prevMaps.filter((map) => !ids.includes(map.id));
        return filtered;
      });
      setMapStates((prevMapsStates) => {
        const filtered = prevMapsStates.filter(
          (state) => !ids.includes(state.mapId)
        );
        return filtered;
      });
    },
    [database]
  );

  const resetMap = useCallback(
    async (id) => {
      const state = { ...defaultMapState, mapId: id };
      await database.table("states").put(state);
      setMapStates((prevMapStates) => {
        const newStates = [...prevMapStates];
        const i = newStates.findIndex((state) => state.mapId === id);
        if (i > -1) {
          newStates[i] = state;
        }
        return newStates;
      });
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
      setMaps((prevMaps) => {
        const newMaps = [...prevMaps];
        const i = newMaps.findIndex((map) => map.id === id);
        if (i > -1) {
          newMaps[i] = { ...newMaps[i], ...update };
        }
        return newMaps;
      });
    },
    [database, getMapFromDB]
  );

  const updateMaps = useCallback(
    async (ids, update) => {
      await Promise.all(
        ids.map((id) => database.table("maps").update(id, update))
      );
      setMaps((prevMaps) => {
        const newMaps = [...prevMaps];
        for (let id of ids) {
          const i = newMaps.findIndex((map) => map.id === id);
          if (i > -1) {
            newMaps[i] = { ...newMaps[i], ...update };
          }
        }
        return newMaps;
      });
    },
    [database]
  );

  const updateMapState = useCallback(
    async (id, update) => {
      await database.table("states").update(id, update);
      setMapStates((prevMapStates) => {
        const newStates = [...prevMapStates];
        const i = newStates.findIndex((state) => state.mapId === id);
        if (i > -1) {
          newStates[i] = { ...newStates[i], ...update };
        }
        return newStates;
      });
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
      setMaps((prevMaps) => {
        const newMaps = [...prevMaps];
        const i = newMaps.findIndex((m) => m.id === map.id);
        if (i > -1) {
          newMaps[i] = { ...newMaps[i], ...map };
        } else {
          newMaps.unshift(map);
        }
        return newMaps;
      });
      if (map.owner !== userId) {
        await updateCache();
      }
    },
    [database, updateCache, userId]
  );

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
  };
  return (
    <MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
  );
}

export default MapDataContext;
