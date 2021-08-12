import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "theme-ui";

import EraseAllIcon from "../../../icons/EraseAllIcon";
import MapMenu from "../../map/MapMenu";

type EraseAllButtonProps = {
  onToolAction: (action: string) => void;
  disabled: boolean;
};

function EraseAllButton({ onToolAction, disabled }: EraseAllButtonProps) {
  const [isEraseAllConfirmOpen, setIsEraseAllConfirmOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  useEffect(() => {
    const button = buttonRef.current;
    if (isEraseAllConfirmOpen && button) {
      const rect = button.getBoundingClientRect();
      setMenuLeft(rect.left + rect.width / 2);
      setMenuTop(rect.bottom + 8);
    }
  }, [isEraseAllConfirmOpen]);

  return (
    <>
      <IconButton
        aria-label="Erase All"
        title="Erase All"
        onClick={() => setIsEraseAllConfirmOpen(true)}
        disabled={disabled}
        ref={buttonRef}
      >
        <EraseAllIcon />
      </IconButton>
      <MapMenu
        isOpen={isEraseAllConfirmOpen}
        onRequestClose={() => setIsEraseAllConfirmOpen(false)}
        left={menuLeft}
        top={menuTop}
        style={{ transform: "translateX(-50%)" }}
      >
        <Button
          disabled={disabled}
          onClick={() => {
            setIsEraseAllConfirmOpen(false);
            onToolAction("eraseAll");
          }}
        >
          Erase All
        </Button>
      </MapMenu>
    </>
  );
}

export default EraseAllButton;
