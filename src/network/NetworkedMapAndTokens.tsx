import { useState, useEffect, useRef } from "react";
import { useToasts } from "react-toast-notifications";

import { useMapData } from "../contexts/MapDataContext";
import { useMapLoading } from "../contexts/MapLoadingContext";
import { useUserId } from "../contexts/UserIdContext";
import { useDatabase } from "../contexts/DatabaseContext";
import { useParty } from "../contexts/PartyContext";
import { useAssets } from "../contexts/AssetsContext";

import useDebounce from "../hooks/useDebounce";
import useNetworkedState from "../hooks/useNetworkedState";
import useMapActions from "../hooks/useMapActions";

import Session, { PeerDataEvent, PeerDataProgressEvent } from "./Session";

import Action from "../actions/Action";

import Map from "../components/map/Map";
import TokenBar from "../components/token/TokenBar";

import GlobalImageDrop from "../components/image/GlobalImageDrop";

import { Map as MapType } from "../types/Map";
import { MapState } from "../types/MapState";
import {
  AssetManifest,
  AssetManifestAsset,
  AssetManifestAssets,
} from "../types/Asset";
import { TokenState } from "../types/TokenState";
import { DrawingState } from "../types/Drawing";
import { FogState } from "../types/Fog";
import { Note } from "../types/Note";
import {
  AddStatesAction,
  EditStatesAction,
  RemoveStatesAction,
} from "../actions";

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

  async function handleMapChange(
    newMap: MapType | null,
    newMapState: MapState | null
  ) {
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

  const [mapActions, addActions, updateActionIndex, resetActions] =
    useMapActions(setCurrentMapState);

  function handleMapReset(newMapState: MapState) {
    setCurrentMapState(newMapState, true, true);
    resetActions();
  }

  function handleMapDraw(action: Action<DrawingState>) {
    addActions([{ type: "drawings", action }]);
  }

  function handleFogDraw(action: Action<FogState>) {
    addActions([{ type: "fogs", action }]);
  }

  function handleUndo() {
    updateActionIndex(-1);
  }

  function handleRedo() {
    updateActionIndex(1);
  }

  // If map changes clear map actions
  const previousMapIdRef = useRef<string>();
  useEffect(() => {
    if (currentMap && currentMap?.id !== previousMapIdRef.current) {
      resetActions();
      previousMapIdRef.current = currentMap?.id;
    }
  }, [currentMap, resetActions]);

  function handleNoteCreate(notes: Note[]) {
    const action = new AddStatesAction(notes);
    addActions([{ type: "notes", action }]);
  }

  function handleNoteChange(changes: Record<string, Partial<Note>>) {
    let edits: Partial<Note>[] = [];
    for (let id in changes) {
      edits.push({ ...changes[id], id });
    }
    const action = new EditStatesAction(edits);
    addActions([{ type: "notes", action }]);
  }

  function handleNoteRemove(noteIds: string[]) {
    const action = new RemoveStatesAction<Note>(noteIds);
    addActions([{ type: "notes", action }]);
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

    const action = new AddStatesAction(tokenStates);
    addActions([{ type: "tokens", action }]);
  }

  function handleMapTokenStateChange(
    changes: Record<string, Partial<TokenState>>
  ) {
    let edits: Partial<TokenState>[] = [];
    for (let id in changes) {
      edits.push({ ...changes[id], id });
    }
    const action = new EditStatesAction(edits);
    addActions([{ type: "tokens", action }]);
  }

  function handleMapTokenStateRemove(tokenStateIds: string[]) {
    const action = new RemoveStatesAction<TokenState>(tokenStateIds);
    addActions([{ type: "tokens", action }]);
  }

  function handleSelectionItemsChange(
    tokenChanges: Record<string, Partial<TokenState>>,
    noteChanges: Record<string, Partial<Note>>
  ) {
    let tokenEdits: Partial<TokenState>[] = [];
    for (let id in tokenChanges) {
      tokenEdits.push({ ...tokenChanges[id], id });
    }
    const tokenAction = new EditStatesAction(tokenEdits);

    let noteEdits: Partial<Note>[] = [];
    for (let id in noteChanges) {
      noteEdits.push({ ...noteChanges[id], id });
    }
    const noteAction = new EditStatesAction(noteEdits);

    addActions([
      { type: "tokens", action: tokenAction },
      { type: "notes", action: noteAction },
    ]);
  }

  useEffect(() => {
    async function handlePeerData({ id, data, reply }: PeerDataEvent) {
      if (id === "assetRequest") {
        const asset = await getAsset(data.id);
        if (asset) {
          reply("assetResponseSuccess", asset, data.id);
        } else {
          reply("assetResponseFail", data.id, data.id);
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
    }: PeerDataProgressEvent) {
      assetProgressUpdate({ id, total, count });
    }

    async function handleSocketMap(map?: MapType) {
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
        onSelectionItemsChange={handleSelectionItemsChange}
        onMapChange={handleMapChange}
        onMapReset={handleMapReset}
        onMapDraw={handleMapDraw}
        onFogDraw={handleFogDraw}
        onMapNoteCreate={handleNoteCreate}
        onMapNoteChange={handleNoteChange}
        onMapNoteRemove={handleNoteRemove}
        allowMapChange={canChangeMap}
        session={session}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <TokenBar onMapTokensStateCreate={handleMapTokensStateCreate} />
    </GlobalImageDrop>
  );
}

export default NetworkedMapAndTokens;
