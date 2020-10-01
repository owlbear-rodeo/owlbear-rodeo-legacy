import React, { useContext } from "react";
import { Flex, Box, Text, IconButton, Close, Label } from "theme-ui";
import SimpleBar from "simplebar-react";
import { useMedia } from "react-media";
import Case from "case";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";
import GroupIcon from "../../icons/GroupIcon";

import TokenTile from "./TokenTile";
import Link from "../Link";
import FilterBar from "../FilterBar";

import DatabaseContext from "../../contexts/DatabaseContext";

function TokenTiles({
  tokens,
  groups,
  onTokenAdd,
  onTokenEdit,
  onTokenSelect,
  selectedTokens,
  onTokensRemove,
  selectMode,
  onSelectModeChange,
  search,
  onSearchChange,
  onTokensGroup,
}) {
  const { databaseStatus } = useContext(DatabaseContext);
  const isSmallScreen = useMedia({ query: "(max-width: 500px)" });

  let hasSelectedDefaultToken = false;
  for (let token of selectedTokens) {
    if (token.type === "default") {
      hasSelectedDefaultToken = true;
      break;
    }
  }

  function tokenToTile(token) {
    const isSelected = selectedTokens.includes(token);
    return (
      <TokenTile
        key={token.id}
        token={token}
        isSelected={isSelected}
        onTokenSelect={onTokenSelect}
        onTokenEdit={onTokenEdit}
        large={isSmallScreen}
        canEdit={
          isSelected &&
          token.type !== "default" &&
          selectMode === "single" &&
          selectedTokens.length === 1
        }
        badges={[`${token.defaultSize}x`]}
      />
    );
  }

  const multipleSelected = selectedTokens.length > 1;

  return (
    <Box sx={{ position: "relative" }}>
      <FilterBar
        onFocus={() => onTokenSelect()}
        search={search}
        onSearchChange={onSearchChange}
        selectMode={selectMode}
        onSelectModeChange={onSelectModeChange}
        onAdd={onTokenAdd}
        addTitle="Add Token"
      />
      <SimpleBar style={{ height: "400px" }}>
        <Flex
          p={2}
          pb={4}
          bg="muted"
          sx={{
            flexWrap: "wrap",
            borderRadius: "4px",
            minHeight: "400px",
            alignContent: "flex-start",
          }}
          onClick={() => onTokenSelect()}
        >
          {groups.map((group) => (
            <React.Fragment key={group}>
              <Label mx={1} mt={2}>
                {Case.capital(group)}
              </Label>
              {tokens[group].map(tokenToTile)}
            </React.Fragment>
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
      {selectedTokens.length > 0 && (
        <Flex
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: "space-between",
          }}
          bg="overlay"
        >
          <Close
            title="Clear Selection"
            aria-label="Clear Selection"
            onClick={() => onTokenSelect()}
          />
          <Flex>
            <IconButton
              aria-label={multipleSelected ? "Group Tokens" : "Group Token"}
              title={multipleSelected ? "Group Tokens" : "Group Token"}
              onClick={() => onTokensGroup()}
              disabled={hasSelectedDefaultToken}
            >
              <GroupIcon />
            </IconButton>
            <IconButton
              aria-label={multipleSelected ? "Remove Tokens" : "Remove Token"}
              title={multipleSelected ? "Remove Tokens" : "Remove Token"}
              onClick={() => onTokensRemove()}
              disabled={hasSelectedDefaultToken}
            >
              <RemoveTokenIcon />
            </IconButton>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

export default TokenTiles;
