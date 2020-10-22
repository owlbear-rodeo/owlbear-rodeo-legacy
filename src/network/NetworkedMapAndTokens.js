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

  const { putToken, getToken, updateToken } = useContext(TokenDataContext);
  const { putMap, updateMap, getMapFromDB, updateMapState } = useContext(
    MapDataContext
  );

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
      updateMapState(debouncedMapState.mapId, debouncedMapState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMap, debouncedMapState, userId, database]);

  function handleMapChange(newMap, newMapState) {
    setCurrentMapState(newMapState);
    setCurrentMap(newMap);
    session.send("map", null, "map");

    if (!newMap || !newMapState) {
      return;
    }

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
          tokens.push(rest);
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
          const cachedMap = await getMapFromDB(newMap.id);
          if (cachedMap && cachedMap.lastModified >= newMap.lastModified) {
            // Update last used for cache invalidation
            const lastUsed = Date.now();
            await updateMap(cachedMap.id, { lastUsed });
            setCurrentMap({ ...cachedMap, lastUsed });
          } else {
            // Save map data but remove last modified so if there is an error
            // during the map request the cache is invalid. Also add last used
            // for cache invalidation
            await putMap({ ...newMap, lastModified: 0, lastUsed: Date.now() });
            reply("mapRequest", newMap.id, "map");
          }
        } else {
          setCurrentMap(newMap);
        }
      }
      if (id === "mapRequest") {
        const map = await getMapFromDB(data);

        function replyWithPreview(preview) {
          if (map.resolutions[preview]) {
            reply(
              "mapResponse",
              {
                id: map.id,
                resolutions: { [preview]: map.resolutions[preview] },
              },
              "map"
            );
          }
        }

        function replyWithFile(file) {
          reply(
            "mapResponse",
            {
              id: map.id,
              file,
              // Add last modified back to file to set cache as valid
              lastModified: map.lastModified,
            },
            "map"
          );
        }

        switch (map.quality) {
          case "low":
            replyWithFile(map.resolutions.low.file);
            break;
          case "medium":
            replyWithPreview("low");
            replyWithFile(map.resolutions.medium.file);
            break;
          case "high":
            replyWithPreview("medium");
            replyWithFile(map.resolutions.high.file);
            break;
          case "ultra":
            replyWithPreview("medium");
            replyWithFile(map.resolutions.ultra.file);
            break;
          case "original":
            if (map.resolutions.medium) {
              replyWithPreview("medium");
            } else if (map.resolutions.low) {
              replyWithPreview("low");
            }
            replyWithFile(map.file);
            break;
          default:
            replyWithFile(map.file);
        }
      }
      if (id === "mapResponse") {
        await updateMap(data.id, data);
        const newMap = await getMapFromDB(data.id);
        setCurrentMap(newMap);
      }
      if (id === "mapState") {
        setCurrentMapState(data);
      }
      if (id === "token") {
        const newToken = data;
        if (newToken && newToken.type === "file") {
          const cachedToken = getToken(newToken.id);
          if (
            cachedToken &&
            cachedToken.lastModified >= newToken.lastModified
          ) {
            // Update last used for cache invalidation
            const lastUsed = Date.now();
            await updateToken(cachedToken.id, { lastUsed });
          } else {
            reply("tokenRequest", newToken.id, "token");
          }
        }
      }
      if (id === "tokenRequest") {
        const token = getToken(data);
        // Add a last used property for cache invalidation
        reply("tokenResponse", { ...token, lastUsed: Date.now() }, "token");
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
        session={session}
      />
      <Tokens onMapTokenStateCreate={handleMapTokenStateCreate} />
    </>
  );
}

export default NetworkedMapAndTokens;
