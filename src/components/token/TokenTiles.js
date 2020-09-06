import React, { useContext } from "react";
import { Flex, Box, Text } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";

import AddIcon from "../../icons/AddIcon";

import TokenTile from "./TokenTile";
import Link from "../Link";

import DatabaseContext from "../../contexts/DatabaseContext";

function TokenTiles({
  tokens,
  onTokenAdd,
  onTokenSelect,
  selectedToken,
  onTokenRemove,
}) {
  const { databaseStatus } = useContext(DatabaseContext);
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  return (
    <Box sx={{ position: "relative" }}>
      <SimpleBar style={{ maxHeight: "300px" }}>
        <Flex
          p={2}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
            justifyContent: "space-between",
          }}
        >
          <Box
            onClick={onTokenAdd}
            sx={{
              ":hover": {
                color: "primary",
              },
              ":focus": {
                outline: "none",
              },
              ":active": {
                color: "secondary",
              },
              width: isSmallScreen ? "49%" : "32%",
              height: "0",
              paddingTop: isSmallScreen ? "49%" : "32%",
              borderRadius: "4px",
              position: "relative",
              cursor: "pointer",
            }}
            my={1}
            bg="muted"
            aria-label="Add Token"
            title="Add Token"
          >
            <Flex
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AddIcon large />
            </Flex>
          </Box>
          {tokens.map((token) => (
            <TokenTile
              key={token.id}
              token={token}
              isSelected={selectedToken && token.id === selectedToken.id}
              onTokenSelect={onTokenSelect}
              onTokenRemove={onTokenRemove}
              large={isSmallScreen}
            />
          ))}
        </Flex>
      </SimpleBar>
      {databaseStatus === "disabled" && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
          bg="highlight"
          p={1}
        >
          <Text as="p" variant="body2">
            Token saving is unavailable. See <Link to="/faq#saving">FAQ</Link>{" "}
            for more information.
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default TokenTiles;
