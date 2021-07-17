import { useState, useEffect, useRef } from "react";
import { useToasts } from "react-toast-notifications";

import { useMapData } from "../contexts/MapDataContext";
import { useMapLoading } from "../contexts/MapLoadingContext";
import { useUserId } from "../contexts/UserIdContext";
import { useDatabase } from "../contexts/DatabaseContext";
import { useParty } from "../contexts/PartyContext";
import { useAssets } from "../contexts/AssetsContext";

import { omit } from "../helpers/shared";

import useDebounce from "../hooks/useDebounce";
import useNetworkedState from "../hooks/useNetworkedState";

// Load session for auto complete
import Session from "./Session";

import Action from "../actions/Action";

import Map from "../components/map/Map";
import TokenBar from "../components/token/TokenBar";

import GlobalImageDrop from "../components/image/GlobalImageDrop";

import {
  Map as MapType,
  MapActions,
  MapActionsIndexKey,
  MapActionsKey,
} from "../types/Map";
import { MapState } from "../types/MapState";
import {
  AssetManifest,
  AssetManifestAsset,
  AssetManifestAssets,
} from "../types/Asset";
import { TokenState } from "../types/TokenState";
import { DrawingState } from "../types/Drawing";
import { FogState } from "../types/Fog";

const defaultMapActions: MapActions = {
  mapDrawActions: [],
  mapDrawActionIndex: -1,
  fogDrawActions: [],
  fogDrawActionIndex: -1,
};

/**
 * @typedef {object} NetworkedMapProps
 * @property {Session} session
 */

/**
 * @param {NetworkedMapProps} props
 */
function NetworkedMapAndTokens({ session }: { session: Session }) {
  const { addToast } = useToasts();
  const userId = useUserId();
  const partyState = useParty();
  const { assetLoadStart, assetProgressUpdate, isLoading } = useMapLoading();

  const { updateMapState } = useMapData();
  const { getAsset, putAsset } = useAssets();

  const [currentMap, setCurrentMap] = useState<MapType | null>(null);
  const [currentMapState, setCurrentMapState] =
    useNetworkedState<MapState | null>(
      null,
      session,
      "map_state",
      500,
      true,
      "mapId"
    );
  const [assetManifest, setAssetManifest] =
    useNetworkedState<AssetManifest | null>(
      null,
      session,
      "manifest",
      500,
      true,
      "mapId"
    );

  async function loadAssetManifestFromMap(map: MapType, mapState: MapState) {
    const assets: AssetManifestAssets = {};
    const { owner } = map;
    let processedTokens = new Set();
    for (let tokenState of Object.values(mapState.tokens)) {
      if (tokenState.type === "file" && !processedTokens.has(tokenState.file)) {
        processedTokens.add(tokenState.file);
        assets[tokenState.file] = {
          id: tokenState.file,
          owner: tokenState.owner,
        };
      }
    }
    if (map.type === "file") {
      assets[map.thumbnail] = { id: map.thumbnail, owner };
      if (map.quality !== "original") {
        const qualityId = map.resolutions[map.quality];
        if (qualityId) {
          assets[qualityId] = { id: qualityId, owner };
        }
      } else {
        assets[map.file] = { id: map.file, owner };
      }
    }
    setAssetManifest({ mapId: map.id, assets }, true, true);
  }

  function addAssetsIfNeeded(assets: AssetManifestAsset[]) {
    setAssetManifest((prevManifest) => {
      if (prevManifest?.assets) {
        let newAssets = { ...prevManifest.assets };
        for (let asset of assets) {
          const id = asset.id;
          const exists = id in newAssets;
          if (!exists) {
            newAssets[id] = asset;
          }
        }
        return { ...prevManifest, assets: newAssets };
      }
      return prevManifest;
    });
  }

  // Keep track of assets we are already requesting to prevent from loading them multiple times
  const requestingAssetsRef = useRef(new Set());

  useEffect(() => {
    if (!assetManifest || !userId) {
      return;
    }

    async function requestAssetsIfNeeded() {
      if (!assetManifest) {
        return;
      }
      for (let asset of Object.values(assetManifest.assets)) {
        if (
          asset.owner === userId ||
          requestingAssetsRef.current.has(asset.id)
        ) {
          continue;
        }

        const owner = Object.values(partyState).find(
          (player) => player.userId === asset.owner
        );

        // Ensure requests are added before any async operation to prevent them from sending twice
        requestingAssetsRef.current.add(asset.id);

        const cachedAsset = await getAsset(asset.id);
        if (!owner) {
          // Add no owner toast if we don't have asset in out cache
          if (!cachedAsset) {
            // TODO: Stop toast from appearing multiple times
            addToast("Unable to find owner for asset");
          }
          requestingAssetsRef.current.delete(asset.id);
          continue;
        }

        if (cachedAsset) {
          requestingAssetsRef.current.delete(asset.id);
        } else if (owner.sessionId) {
          assetLoadStart(asset.id);
          session.sendTo(owner.sessionId, "assetRequest", asset);
        }
      }
    }

    requestAssetsIfNeeded();
  }, [
    assetManifest,
    partyState,
    session,
    userId,
    addToast,
    getAsset,
    assetLoadStart,
  ]);

  /**
   * Map state
   */

  const { database } = useDatabase();
  // Sync the map state to the database after 500ms of inactivity
  const debouncedMapState = useDebounce(currentMapState, 500);
  useEffect(() => {
    if (
      debouncedMapState &&
      debouncedMapState.mapId &&
      currentMap &&
      currentMap?.owner === userId &&
      database
    ) {
      updateMapState(debouncedMapState.mapId, debouncedMapState);
    }
  }, [currentMap, debouncedMapState, userId, database, updateMapState]);

  async function handleMapChange(newMap, newMapState) {
    // Clear map before sending new one
    setCurrentMap(null);
    session.socket?.emit("map", null);

    setCurrentMapState(newMapState, true, true);
    setCurrentMap(newMap);

    session.socket?.emit("map", newMap);

    if (!newMap || !newMapState) {
      setAssetManifest(null, true, true);
      return;
    }

    await loadAssetManifestFromMap(newMap, newMapState);
  }

  function handleMapReset(newMapState) {
    setCurrentMapState(newMapState, true, true);
    setMapActions(defaultMapActions);
  }

  const [mapActions, setMapActions] = useState(defaultMapActions);

  function addMapActions(
    actions: Action<DrawingState | FogState>[],
    indexKey: MapActionsIndexKey,
    actionsKey: MapActionsKey,
    shapesKey: "drawShapes" | "fogShapes"
  ) {
    setMapActions((prevMapActions) => {
      const newActions = [
        ...prevMapActions[actionsKey].slice(0, prevMapActions[indexKey] + 1),
        ...actions,
      ];
      const newIndex = newActions.length - 1;
      return {
        ...prevMapActions,
        [actionsKey]: newActions,
        [indexKey]: newIndex,
      };
    });
    // Update map state by performing the actions on it
    setCurrentMapState((prevMapState) => {
      if (!prevMapState) {
        return prevMapState;
      }
      let shapes = prevMapState[shapesKey];
      for (let action of actions) {
        shapes = action.execute(shapes);
      }
      return {
        ...prevMapState,
        [shapesKey]: shapes,
      };
    });
  }

  function updateActionIndex(
    change,
    indexKey: MapActionsIndexKey,
    actionsKey: MapActionsKey,
    shapesKey: "drawShapes" | "fogShapes"
  ) {
    const prevIndex = mapActions[indexKey];
    const newIndex = Math.min(
      Math.max(mapActions[indexKey] + change, -1),
      mapActions[actionsKey].length - 1
    );

    setMapActions((prevMapActions) => ({
      ...prevMapActions,
      [indexKey]: newIndex,
    }));

    // Update map state by either performing the actions or undoing them
    setCurrentMapState((prevMapState) => {
      if (prevMapState) {
        let shapes = prevMapState[shapesKey];
        if (prevIndex < newIndex) {
          // Redo
          for (let i = prevIndex + 1; i < newIndex + 1; i++) {
            let action = mapActions[actionsKey][i];
            shapes = action.execute(shapes);
          }
        } else {
          // Undo
          for (let i = prevIndex; i > newIndex; i--) {
            let action = mapActions[actionsKey][i];
            shapes = action.undo(shapes);
          }
        }
        return {
          ...prevMapState,
          [shapesKey]: shapes,
        };
      }
    });

    return newIndex;
  }

  function handleMapDraw(action: Action<DrawingState>) {
    addMapActions(
      [action],
      "mapDrawActionIndex",
      "mapDrawActions",
      "drawShapes"
    );
  }

  function handleMapDrawUndo() {
    updateActionIndex(-1, "mapDrawActionIndex", "mapDrawActions", "drawShapes");
  }

  function handleMapDrawRedo() {
    updateActionIndex(1, "mapDrawActionIndex", "mapDrawActions", "drawShapes");
  }

  function handleFogDraw(action: Action<FogState>) {
    addMapActions(
      [action],
      "fogDrawActionIndex",
      "fogDrawActions",
      "fogShapes"
    );
  }

  function handleFogDrawUndo() {
    updateActionIndex(-1, "fogDrawActionIndex", "fogDrawActions", "fogShapes");
  }

  function handleFogDrawRedo() {
    updateActionIndex(1, "fogDrawActionIndex", "fogDrawActions", "fogShapes");
  }

  // If map changes clear map actions
  const previousMapIdRef = useRef();
  useEffect(() => {
    if (currentMap && currentMap?.id !== previousMapIdRef.current) {
      setMapActions(defaultMapActions);
      previousMapIdRef.current = currentMap?.id;
    }
  }, [currentMap]);

  function handleNoteChange(note) {
    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      notes: {
        ...prevMapState.notes,
        [note.id]: note,
      },
    }));
  }

  function handleNoteRemove(noteId: string) {
    setCurrentMapState((prevMapState) => ({
      ...prevMapState,
      notes: omit(prevMapState.notes, [noteId]),
    }));
  }

  /**
   * Token state
   */

  async function handleMapTokensStateCreate(tokenStates: TokenState[]) {
    if (!currentMap || !currentMapState) {
      return;
    }

    let assets: AssetManifestAsset[] = [];
    for (let tokenState of tokenStates) {
      if (tokenState.type === "file") {
        assets.push({ id: tokenState.file, owner: tokenState.owner });
      }
    }
    if (assets.length > 0) {
      addAssetsIfNeeded(assets);
    }

    setCurrentMapState((prevMapState) => {
      let newMapTokens = { ...prevMapState.tokens };
      for (let tokenState of tokenStates) {
        newMapTokens[tokenState.id] = tokenState;
      }
      return { ...prevMapState, tokens: newMapTokens };
    });
  }

  function handleMapTokenStateChange(change) {
    if (!currentMapState) {
      return;
    }
    setCurrentMapState((prevMapState) => {
      let tokens = { ...prevMapState.tokens };
      for (let id in change) {
        if (id in tokens) {
          tokens[id] = { ...tokens[id], ...change[id] };
        }
      }

      return {
        ...prevMapState,
        tokens,
      };
    });
  }

  function handleMapTokenStateRemove(tokenState) {
    setCurrentMapState((prevMapState) => {
      const { [tokenState.id]: old, ...rest } = prevMapState.tokens;
      return { ...prevMapState, tokens: rest };
    });
  }

  useEffect(() => {
    async function handlePeerData({
      id,
      data,
      reply,
    }: {
      id: string;
      data;
      reply;
    }) {
      if (id === "assetRequest") {
        const asset = await getAsset(data.id);
        if (asset) {
          reply("assetResponseSuccess", asset, undefined, data.id);
        } else {
          reply("assetResponseFail", data.id, undefined, data.id);
        }
      }

      if (id === "assetResponseSuccess") {
        const asset = data;
        await putAsset(asset);
        requestingAssetsRef.current.delete(asset.id);
      }

      if (id === "assetResponseFail") {
        const assetId = data;
        requestingAssetsRef.current.delete(assetId);
      }
    }

    function handlePeerDataProgress({
      id,
      total,
      count,
    }: {
      id: string;
      total: number;
      count: number;
    }) {
      assetProgressUpdate({ id, total, count });
    }

    async function handleSocketMap(map) {
      if (map) {
        setCurrentMap(map);
      } else {
        setCurrentMap(null);
      }
    }

    session.on("peerData", handlePeerData);
    session.on("peerDataProgress", handlePeerDataProgress);
    session.socket?.on("map", handleSocketMap);

    return () => {
      session.off("peerData", handlePeerData);
      session.off("peerDataProgress", handlePeerDataProgress);
      session.socket?.off("map", handleSocketMap);
    };
  });

  const canChangeMap = !isLoading;

  const canEditMapDrawing =
    currentMap &&
    currentMapState &&
    (currentMapState.editFlags.includes("drawing") ||
      currentMap?.owner === userId);

  const canEditFogDrawing =
    currentMap &&
    currentMapState &&
    (currentMapState.editFlags.includes("fog") || currentMap?.owner === userId);

  const canEditNotes =
    currentMap &&
    currentMapState &&
    (currentMapState.editFlags.includes("notes") ||
      currentMap?.owner === userId);

  const disabledMapTokens = {};
  // If we have a map and state and have the token permission disabled
  // and are not the map owner
  if (
    currentMapState &&
    currentMap &&
    !currentMapState.editFlags.includes("tokens") &&
    currentMap?.owner !== userId
  ) {
    for (let token of Object.values(currentMapState.tokens)) {
      if (token.owner !== userId) {
        disabledMapTokens[token.id] = true;
      }
    }
  }

  return (
    <GlobalImageDrop
      onMapChange={handleMapChange}
      onMapTokensStateCreate={handleMapTokensStateCreate}
    >
      <Map
        map={currentMap}
        mapState={currentMapState}
        mapActions={mapActions}
        onMapTokenStateChange={handleMapTokenStateChange}
        onMapTokenStateRemove={handleMapTokenStateRemove}
        onMapChange={handleMapChange}
        onMapReset={handleMapReset}
        onMapDraw={handleMapDraw}
        onMapDrawUndo={handleMapDrawUndo}
        onMapDrawRedo={handleMapDrawRedo}
        onFogDraw={handleFogDraw}
        onFogDrawUndo={handleFogDrawUndo}
        onFogDrawRedo={handleFogDrawRedo}
        onMapNoteChange={handleNoteChange}
        onMapNoteRemove={handleNoteRemove}
        allowMapDrawing={canEditMapDrawing}
        allowFogDrawing={canEditFogDrawing}
        allowMapChange={canChangeMap}
        allowNoteEditing={canEditNotes}
        disabledTokens={disabledMapTokens}
        session={session}
      />
      <TokenBar onMapTokensStateCreate={handleMapTokensStateCreate} />
    </GlobalImageDrop>
  );
}

export default NetworkedMapAndTokens;
