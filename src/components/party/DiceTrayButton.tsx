import React, { useState } from "react";
import { Flex, IconButton, Box } from "theme-ui";

import ExpandMoreDiceIcon from "../../icons/ExpandMoreDiceIcon";

import { DiceLoadingProvider } from "../../contexts/DiceLoadingContext";

import useSetting from "../../hooks/useSetting";

import LoadingOverlay from "../LoadingOverlay";

const DiceTrayOverlay = React.lazy(() => import("../dice/DiceTrayOverlay"));

function DiceTrayButton({
  shareDice,
  onShareDiceChange,
  diceRolls,
  onDiceRollsChange,
}: {
  shareDice: boolean;
  onShareDiceChange;
  diceRolls: [];
  onDiceRollsChange;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullScreen] = useSetting("map.fullScreen");

  return (
    <Flex
      sx={{
        position: "absolute",
        top: 0,
        left: fullScreen ? "0" : "100%",
        bottom: 0,
        flexDirection: "column",
        alignItems: "flex-start",
        pointerEvents: "none",
        zIndex: 1,
      }}
      ml={1}
    >
      <IconButton
        aria-label={isExpanded ? "Hide Dice Tray" : "Show Dice Tray"}
        title={isExpanded ? "Hide Dice Tray" : "Show Dice Tray"}
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: "block",
          backgroundColor: "overlay",
          borderRadius: "50%",
          pointerEvents: "all",
        }}
        m={2}
      >
        <ExpandMoreDiceIcon isExpanded={isExpanded} />
      </IconButton>
      <DiceLoadingProvider>
        <React.Suspense
          fallback={
            isExpanded && (
              <Box
                sx={{
                  width: "32px",
                  height: "32px",
                  position: "absolute",
                  top: "40px",
                  left: "8px",
                }}
              >
                <LoadingOverlay />
              </Box>
            )
          }
        >
          <DiceTrayOverlay
            isOpen={isExpanded}
            shareDice={shareDice}
            onShareDiceChange={onShareDiceChange}
            diceRolls={diceRolls}
            onDiceRollsChange={onDiceRollsChange}
          />
        </React.Suspense>
      </DiceLoadingProvider>
    </Flex>
  );
}

export default DiceTrayButton;
