import DragOverlay from "../map/DragOverlay";
import { TokenStateRemoveHandler } from "../../types/Events";
import { TokenState } from "../../types/TokenState";

type TokenDragOverlayProps = {
  onTokenStateRemove: TokenStateRemoveHandler;
  tokenState: TokenState;
  dragging: boolean;
};

function TokenDragOverlay({
  onTokenStateRemove,
  tokenState,
  dragging,
}: TokenDragOverlayProps) {
  function handleTokenRemove() {
    onTokenStateRemove([tokenState.id]);
  }

  return <DragOverlay dragging={dragging} onRemove={handleTokenRemove} />;
}

export default TokenDragOverlay;
