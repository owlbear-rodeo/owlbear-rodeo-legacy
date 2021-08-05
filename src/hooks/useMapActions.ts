import { useState, useCallback } from "react";
import Action from "../actions/Action";
import { DrawingState } from "../types/Drawing";
import { FogState } from "../types/Fog";
import { MapState } from "../types/MapState";
import { Notes } from "../types/Note";
import { TokenStates } from "../types/TokenState";

export type DrawingsAction = {
  type: "drawings";
  action: Action<DrawingState>;
};
export type FogsAction = { type: "fogs"; action: Action<FogState> };
export type TokensAction = { type: "tokens"; action: Action<TokenStates> };
export type NotesAction = { type: "notes"; action: Action<Notes> };

export type MapAction =
  | DrawingsAction
  | FogsAction
  | TokensAction
  | NotesAction;

export type MapActions = {
  actions: MapAction[][];
  actionIndex: number;
};

export type AddActionsEventHandler = (actions: MapAction[]) => void;
export type UpdateActionIndexEventHandler = (change: number) => void;
export type ResetActionsEventHandler = () => void;

const defaultMapActions: MapActions = {
  actions: [],
  actionIndex: -1,
};

function useMapActions(
  setCurrentMapState: React.Dispatch<React.SetStateAction<MapState | null>>
): [
  MapActions,
  AddActionsEventHandler,
  UpdateActionIndexEventHandler,
  ResetActionsEventHandler
] {
  const [mapActions, setMapActions] = useState(defaultMapActions);

  function applyMapActionsToState(
    mapState: MapState,
    actions: MapAction[]
  ): MapState {
    for (let mapAction of actions) {
      if (mapAction.type === "drawings") {
        mapState.drawings = mapAction.action.execute(mapState.drawings);
      } else if (mapAction.type === "fogs") {
        mapState.fogs = mapAction.action.execute(mapState.fogs);
      } else if (mapAction.type === "tokens") {
        mapState.tokens = mapAction.action.execute(mapState.tokens);
      } else if (mapAction.type === "notes") {
        mapState.notes = mapAction.action.execute(mapState.notes);
      }
    }
    return mapState;
  }

  function undoMapActionsToState(
    mapState: MapState,
    actions: MapAction[]
  ): MapState {
    for (let mapAction of actions) {
      if (mapAction.type === "drawings") {
        mapState.drawings = mapAction.action.undo(mapState.drawings);
      } else if (mapAction.type === "fogs") {
        mapState.fogs = mapAction.action.undo(mapState.fogs);
      } else if (mapAction.type === "tokens") {
        mapState.tokens = mapAction.action.undo(mapState.tokens);
      } else if (mapAction.type === "notes") {
        mapState.notes = mapAction.action.undo(mapState.notes);
      }
    }
    return mapState;
  }

  function addActions(actions: MapAction[]) {
    setMapActions((prevActions) => {
      const newActions = [
        ...prevActions.actions.slice(0, prevActions.actionIndex + 1),
        actions,
      ];
      const newIndex = newActions.length - 1;
      return {
        actions: newActions,
        actionIndex: newIndex,
      };
    });

    // Update map state by performing the actions on it
    setCurrentMapState((prevMapState) => {
      if (!prevMapState) {
        return prevMapState;
      }
      let state = { ...prevMapState };
      state = applyMapActionsToState(state, actions);
      return state;
    });
  }

  function updateActionIndex(change: number) {
    const prevIndex = mapActions.actionIndex;
    const newIndex = Math.min(
      Math.max(mapActions.actionIndex + change, -1),
      mapActions.actions.length - 1
    );

    setMapActions((prevMapActions) => ({
      ...prevMapActions,
      actionIndex: newIndex,
    }));

    // Update map state by either performing the actions or undoing them
    setCurrentMapState((prevMapState) => {
      if (!prevMapState) {
        return prevMapState;
      }
      let state = { ...prevMapState };
      if (prevIndex < newIndex) {
        // Redo
        for (let i = prevIndex + 1; i < newIndex + 1; i++) {
          const actions = mapActions.actions[i];
          state = applyMapActionsToState(state, actions);
        }
      } else {
        // Undo
        for (let i = prevIndex; i > newIndex; i--) {
          const actions = mapActions.actions[i];
          state = undoMapActionsToState(state, actions);
        }
      }
      return state;
    });
  }

  const resetActions = useCallback(() => {
    setMapActions(defaultMapActions);
  }, []);

  return [mapActions, addActions, updateActionIndex, resetActions];
}

export default useMapActions;
