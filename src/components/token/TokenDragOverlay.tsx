import Konva from "konva";

import DragOverlay from "../map/DragOverlay";
import { TokenStateRemoveHandler } from "../../types/Events";
import { TokenState } from "../../types/TokenState";

type TokenDragOverlayProps = {
  onTokenStateRemove: TokenStateRemoveHandler;
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
    onTokenStateRemove([tokenState.id]);
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
