import DragOverlay from "../map/DragOverlay";
import { TokenStateRemoveHandler } from "../../types/Events";
import { TokenDraggingOptions } from "../../types/Token";

type TokenDragOverlayProps = {
  onTokenStateRemove: TokenStateRemoveHandler;
  draggingOptions: TokenDraggingOptions;
};

function TokenDragOverlay({
  onTokenStateRemove,
  draggingOptions,
}: TokenDragOverlayProps) {
  function handleTokenRemove() {
    onTokenStateRemove([
      draggingOptions.tokenStateId,
      ...draggingOptions.attachedTokenStateIds,
    ]);
  }

  return (
    <DragOverlay
      dragging={draggingOptions.dragging}
      onRemove={handleTokenRemove}
    />
  );
}

export default TokenDragOverlay;
