import React, { useEffect, useState, useContext } from "react";

import AuthContext from "./AuthContext";
import DatabaseContext from "./DatabaseContext";

import { maps as defaultMaps } from "../maps";

const MapDataContext = React.createContext();

const defaultMapState = {
  tokens: {},
  // An index into the draw actions array to which only actions before the
  // index will be performed (used in undo and redo)
  mapDrawActionIndex: -1,
  mapDrawActions: [],
  fogDrawActionIndex: -1,
  fogDrawActions: [],
  // Flags to determine what other people can edit
  editFlags: ["drawing", "tokens"],
};

export function MapDataProvider({ children }) {
  const { database } = useContext(DatabaseContext);
  const { userId } = useContext(AuthContext);

  const [maps, setMaps] = useState([]);
  const [mapStates, setMapStates] = useState([]);
  // Load maps from the database and ensure state is properly setup
  useEffect(() => {
    if (!userId || !database) {
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
          gridType: "grid",
          showGrid: false,
          snapToGrid: true,
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
      // Use a cursor instead of toArray to prevent IPC max size error
      await database.table("maps").each((map) => storedMaps.push(map));
      const sortedMaps = storedMaps.sort((a, b) => b.created - a.created);
      const defaultMapsWithIds = await getDefaultMaps();
      const allMaps = [...sortedMaps, ...defaultMapsWithIds];
      setMaps(allMaps);
      const storedStates = await database.table("states").toArray();
      setMapStates(storedStates);
    }

    loadMaps();
  }, [userId, database]);

  async function addMap(map) {
    await database.table("maps").add(map);
    const state = { ...defaultMapState, mapId: map.id };
    await database.table("states").add(state);
    setMaps((prevMaps) => [map, ...prevMaps]);
    setMapStates((prevStates) => [state, ...prevStates]);
  }

  async function removeMap(id) {
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
  }

  async function resetMap(id) {
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
  }

  async function updateMap(id, update) {
    await database.table("maps").update(id, update);
    setMaps((prevMaps) => {
      const newMaps = [...prevMaps];
      const i = newMaps.findIndex((map) => map.id === id);
      if (i > -1) {
        newMaps[i] = { ...newMaps[i], ...update };
      }
      return newMaps;
    });
  }

  async function updateMapState(id, update) {
    await database.table("states").update(id, update);
    setMapStates((prevMapStates) => {
      const newStates = [...prevMapStates];
      const i = newStates.findIndex((state) => state.mapId === id);
      if (i > -1) {
        newStates[i] = { ...newStates[i], ...update };
      }
      return newStates;
    });
  }

  async function putMap(map) {
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
  }

  function getMap(mapId) {
    return maps.find((map) => map.id === mapId);
  }

  async function getMapFromDB(mapId) {
    return await database.table("maps").get(mapId);
  }

  const ownedMaps = maps.filter((map) => map.owner === userId);

  const value = {
    maps,
    ownedMaps,
    mapStates,
    addMap,
    removeMap,
    resetMap,
    updateMap,
    updateMapState,
    putMap,
    getMap,
    getMapFromDB,
  };
  return (
    <MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
  );
}

export default MapDataContext;
