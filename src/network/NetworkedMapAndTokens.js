import React, { useState, useContext, useEffect, useCallback } from "react";

import TokenDataContext from "../contexts/TokenDataContext";
import MapDataContext from "../contexts/MapDataContext";
import MapLoadingContext from "../contexts/MapLoadingContext";
import AuthContext from "../contexts/AuthContext";
import DatabaseContext from "../contexts/DatabaseContext";

import { omit } from "../helpers/shared";
import useDebounce from "../helpers/useDebounce";
// Load session for auto complete
// eslint-disable-next-line no-unused-vars
import Session from "../helpers/Session";

import Map from "../components/map/Map";
import Tokens from "../components/token/Tokens";

/**
 * @typedef {object} NetworkedMapProps
 * @property {Session} session
 */

/**
 * @param {NetworkedMapProps} props
 */
function NetworkedMapAndTokens({ session }) {
  const { userId } = useContext(AuthContext);
  const {
    assetLoadStart,
    assetLoadFinish,
    assetProgressUpdate,
    isLoading,
  } = useContext(MapLoadingContext);

  const { putToken, getToken } = useContext(TokenDataContext);
  const { putMap, getMap, updateMap } = useContext(MapDataContext);

  const [currentMap, setCurrentMap] = useState(null);
  const [currentMapState, setCurrentMapState] = useState(null);

  /**
   * Map state
   */

  const { database } = useContext(DatabaseContext);
  // Sync the map state to the database after 500ms of inactivity
  const debouncedMapState = useDebounce(currentMapState, 500);
  useEffect(() => {
    if (
      debouncedMapState &&
      debouncedMapState.mapId &&
      currentMap &&
      currentMap.owner === userId &&
      database
    ) {
      // Update the database directly to avoid re-renders
      database
        .table("states")
        .update(debouncedMapState.mapId, debouncedMapState);
    }
  }, [currentMap, debouncedMapState, userId, database]);

  function handleMapChange(newMap, newMapState) {
    setCurrentMapState(newMapState);
    setCurrentMap(newMap);
    session.send("map", null, "map");
    session.send("mapState", newMapState);
    session.send("map", getMapDataToSend(newMap), "map");
    const tokensToSend = getMapTokensToSend(newMapState);
    for (let token of tokensToSend) {
      session.send("token", token, "token");
    }
  }

  function getMapDataToSend(mapData) {
    // Omit file from map change, receiver will request the file if
    // they have an outdated version
    if (mapData.type === "file") {
      const { file, resolutions, ...rest } = mapData;
      return rest;
    } else {
      return mapData;
    }
  }

  function handleMapStateChange(newMapState) {
    setCurrentMapState(newMapState);
    session.send("mapState", newMapState);
  }

  function addMapDrawActions(actions, indexKey, actionsKey) {
    setCurrentMapState((prevMapState) => {
      const newActions = [
        ...prevMapState[actionsKey].slice(0, prevMapState[indexKey] + 1),
        ...actions,
      ];
      const newIndex = newActions.length - 1;
      return {
        ...prevMapState,
        [actionsKey]: newActions,
        [indexKey]: newIndex,
      };
    });
  }

  function updateDrawActionIndex(change, indexKey, actionsKey) {
    const newIndex = Math.min(
      Math.max(currentMapState[indexKey] + change, -1),
      currentMapState[actionsKey].length - 1
    );

    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      [indexKey]: newIndex,
    }));
    return newIndex;
  }

  function handleMapDraw(action) {
    addMapDrawActions([action], "mapDrawActionIndex", "mapDrawActions");
    session.send("mapDraw", [action]);
  }

  function handleMapDrawUndo() {
    const index = updateDrawActionIndex(
      -1,
      "mapDrawActionIndex",
      "mapDrawActions"
    );
    session.send("mapDrawIndex", index);
  }

  function handleMapDrawRedo() {
    const index = updateDrawActionIndex(
      1,
      "mapDrawActionIndex",
      "mapDrawActions"
    );
    session.send("mapDrawIndex", index);
  }

  function handleFogDraw(action) {
    addMapDrawActions([action], "fogDrawActionIndex", "fogDrawActions");
    session.send("mapFog", [action]);
  }

  function handleFogDrawUndo() {
    const index = updateDrawActionIndex(
      -1,
      "fogDrawActionIndex",
      "fogDrawActions"
    );
    session.send("mapFogIndex", index);
  }

  function handleFogDrawRedo() {
    const index = updateDrawActionIndex(
      1,
      "fogDrawActionIndex",
      "fogDrawActions"
    );
    session.send("mapFogIndex", index);
  }

  /**
   * Token state
   */

  // Get all tokens from a token state
  const getMapTokensToSend = useCallback(
    (state) => {
      let sentTokens = {};
      const tokens = [];
      for (let tokenState of Object.values(state.tokens)) {
        const token = getToken(tokenState.tokenId);
        if (
          token &&
          token.type === "file" &&
          !(tokenState.tokenId in sentTokens)
        ) {
          sentTokens[tokenState.tokenId] = true;
          // Omit file from token peer will request file if needed
          const { file, ...rest } = token;
          tokens.add(rest);
        }
      }
      return tokens;
    },
    [getToken]
  );

  async function handleMapTokenStateCreate(tokenState) {
    // If file type token send the token to the other peers
    const token = getToken(tokenState.tokenId);
    if (token && token.type === "file") {
      const { file, ...rest } = token;
      session.send("token", rest);
    }
    handleMapTokenStateChange({ [tokenState.id]: tokenState });
  }

  function handleMapTokenStateChange(change) {
    if (currentMapState === null) {
      return;
    }
    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      tokens: {
        ...prevMapState.tokens,
        ...change,
      },
    }));
    session.send("tokenStateEdit", change);
  }

  function handleMapTokenStateRemove(tokenState) {
    setCurrentMapState((prevMapState) => {
      const { [tokenState.id]: old, ...rest } = prevMapState.tokens;
      return { ...prevMapState, tokens: rest };
    });
    session.send("tokenStateRemove", { [tokenState.id]: tokenState });
  }

  useEffect(() => {
    async function handlePeerData({ id, data, reply }) {
      if (id === "sync") {
        if (currentMapState) {
          reply("mapState", currentMapState);
          const tokensToSend = getMapTokensToSend(currentMapState);
          for (let token of tokensToSend) {
            reply("token", token, "token");
          }
        }
        if (currentMap) {
          reply("map", getMapDataToSend(currentMap), "map");
        }
      }
      if (id === "map") {
        const newMap = data;
        if (newMap && newMap.type === "file") {
          const cachedMap = getMap(newMap.id);
          if (cachedMap && cachedMap.lastModified === newMap.lastModified) {
            setCurrentMap(cachedMap);
          } else {
            await putMap(newMap);
            reply("mapRequest", newMap.id, "map");
          }
        } else {
          setCurrentMap(newMap);
        }
      }
      if (id === "mapRequest") {
        const map = getMap(data);
        function replyWithFile(file) {
          reply("mapResponse", { id: map.id, file }, "map");
        }

        switch (map.quality) {
          case "low":
            replyWithFile(map.resolutions.low.file);
            break;
          case "medium":
            replyWithFile(map.resolutions.low.file);
            replyWithFile(map.resolutions.medium.file);
            break;
          case "high":
            replyWithFile(map.resolutions.medium.file);
            replyWithFile(map.resolutions.high.file);
            break;
          case "ultra":
            replyWithFile(map.resolutions.medium.file);
            replyWithFile(map.resolutions.ultra.file);
            break;
          case "original":
            if (map.resolutions.medium) {
              replyWithFile(map.resolutions.medium.file);
            } else if (map.resolutions.low) {
              replyWithFile(map.resolutions.low.file);
            }
            replyWithFile(map.file);
            break;
          default:
            replyWithFile(map.file);
        }
      }
      if (id === "mapResponse") {
        let update = { file: data.file };
        const map = getMap(data.id);
        updateMap(map.id, update).then(() => {
          setCurrentMap({ ...map, ...update });
        });
      }
      if (id === "mapState") {
        setCurrentMapState(data);
      }
      if (id === "token") {
        const newToken = data;
        if (newToken && newToken.type === "file") {
          const cachedToken = getToken(newToken.id);
          if (
            !cachedToken ||
            cachedToken.lastModified !== newToken.lastModified
          ) {
            reply("tokenRequest", newToken.id, "token");
          }
        }
      }
      if (id === "tokenRequest") {
        const token = getToken(data);
        reply("tokenResponse", token, "token");
      }
      if (id === "tokenResponse") {
        const newToken = data;
        if (newToken && newToken.type === "file") {
          putToken(newToken);
        }
      }
      if (id === "tokenStateEdit") {
        setCurrentMapState((prevMapState) => ({
          ...prevMapState,
          tokens: { ...prevMapState.tokens, ...data },
        }));
      }
      if (id === "tokenStateRemove") {
        setCurrentMapState((prevMapState) => ({
          ...prevMapState,
          tokens: omit(prevMapState.tokens, Object.keys(data)),
        }));
      }
      if (id === "mapDraw") {
        addMapDrawActions(data, "mapDrawActionIndex", "mapDrawActions");
      }
      if (id === "mapDrawIndex") {
        setCurrentMapState((prevMapState) => ({
          ...prevMapState,
          mapDrawActionIndex: data,
        }));
      }
      if (id === "mapFog") {
        addMapDrawActions(data, "fogDrawActionIndex", "fogDrawActions");
      }
      if (id === "mapFogIndex") {
        setCurrentMapState((prevMapState) => ({
          ...prevMapState,
          fogDrawActionIndex: data,
        }));
      }
    }

    function handlePeerDataProgress({ id, total, count }) {
      if (count === 1) {
        assetLoadStart();
      }
      if (total === count) {
        assetLoadFinish();
      }
      assetProgressUpdate({ id, total, count });
    }

    session.on("data", handlePeerData);
    session.on("dataProgress", handlePeerDataProgress);

    return () => {
      session.off("data", handlePeerData);
      session.off("dataProgress", handlePeerDataProgress);
    };
  });

  const canChangeMap = !isLoading;

  const canEditMapDrawing =
    currentMap !== null &&
    currentMapState !== null &&
    (currentMapState.editFlags.includes("drawing") ||
      currentMap.owner === userId);

  const canEditFogDrawing =
    currentMap !== null &&
    currentMapState !== null &&
    (currentMapState.editFlags.includes("fog") || currentMap.owner === userId);

  const disabledMapTokens = {};
  // If we have a map and state and have the token permission disabled
  // and are not the map owner
  if (
    currentMapState !== null &&
    currentMap !== null &&
    !currentMapState.editFlags.includes("tokens") &&
    currentMap.owner !== userId
  ) {
    for (let token of Object.values(currentMapState.tokens)) {
      if (token.owner !== userId) {
        disabledMapTokens[token.id] = true;
      }
    }
  }

  return (
    <>
      <Map
        map={currentMap}
        mapState={currentMapState}
        onMapTokenStateChange={handleMapTokenStateChange}
        onMapTokenStateRemove={handleMapTokenStateRemove}
        onMapChange={handleMapChange}
        onMapStateChange={handleMapStateChange}
        onMapDraw={handleMapDraw}
        onMapDrawUndo={handleMapDrawUndo}
        onMapDrawRedo={handleMapDrawRedo}
        onFogDraw={handleFogDraw}
        onFogDrawUndo={handleFogDrawUndo}
        onFogDrawRedo={handleFogDrawRedo}
        allowMapDrawing={canEditMapDrawing}
        allowFogDrawing={canEditFogDrawing}
        allowMapChange={canChangeMap}
        disabledTokens={disabledMapTokens}
      />
      <Tokens onMapTokenStateCreate={handleMapTokenStateCreate} />
    </>
  );
}

export default NetworkedMapAndTokens;
