import Konva from "konva";

import DragOverlay from "../map/DragOverlay";
import { MapTokenStateRemoveHandler } from "../../types/Events";
import { TokenState } from "../../types/TokenState";

type TokenDragOverlayProps = {
  onTokenStateRemove: MapTokenStateRemoveHandler;
  tokenState: TokenState;
  tokenNode: Konva.Node;
  dragging: boolean;
};

function TokenDragOverlay({
  onTokenStateRemove,
  tokenState,
  tokenNode,
  dragging,
}: TokenDragOverlayProps) {
  function handleTokenRemove() {
    onTokenStateRemove(tokenState);
  }

  return (
    <DragOverlay
      dragging={dragging}
      onRemove={handleTokenRemove}
      node={tokenNode}
    />
  );
}

export default TokenDragOverlay;
