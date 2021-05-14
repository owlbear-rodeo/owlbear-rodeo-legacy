import React from "react";
import { Flex, Box, Text, IconButton, Close, Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";
import TokenHideIcon from "../../icons/TokenHideIcon";
import TokenShowIcon from "../../icons/TokenShowIcon";

import TokenTile from "./TokenTile";
import TokenTileGroup from "./TokenTileGroup";
import Link from "../Link";
import FilterBar from "../FilterBar";

import Sortable from "../drag/Sortable";
import SortableTiles from "../drag/SortableTiles";

import { useDatabase } from "../../contexts/DatabaseContext";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

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
  onTokensHide,
}) {
  const { databaseStatus } = useDatabase();
  const layout = useResponsiveLayout();

  let hasSelectedDefaultToken = selectedTokens.some(
    (token) => token.type === "default"
  );
  let allTokensVisible = selectedTokens.every((token) => !token.hideInSidebar);

  function groupToTokenTile(group) {
    if (group.type === "item") {
      const token = tokens.find((token) => token.id === group.id);
      const isSelected = selectedTokens.includes(token);
      return (
        <TokenTile
          key={token.id}
          token={token}
          isSelected={isSelected}
          onTokenSelect={onTokenSelect}
          onTokenEdit={onTokenEdit}
          canEdit={
            isSelected &&
            token.type !== "default" &&
            selectMode === "single" &&
            selectedTokens.length === 1
          }
          badges={[`${token.defaultSize}x`]}
        />
      );
    } else {
      return (
        <TokenTileGroup
          key={group.id}
          group={group}
          tokens={group.items.map((item) =>
            tokens.find((token) => token.id === item.id)
          )}
        />
      );
    }
  }

  const multipleSelected = selectedTokens.length > 1;

  let hideTitle = "";
  if (multipleSelected) {
    if (allTokensVisible) {
      hideTitle = "Hide Tokens in Sidebar";
    } else {
      hideTitle = "Show Tokens in Sidebar";
    }
  } else {
    if (allTokensVisible) {
      hideTitle = "Hide Token in Sidebar";
    } else {
      hideTitle = "Show Token in Sidebar";
    }
  }

  return (
    <SortableTiles
      groups={groups}
      onGroupChange={onTokensGroup}
      renderTile={groupToTokenTile}
    >
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
        <SimpleBar
          style={{
            height: layout.screenSize === "large" ? "600px" : "400px",
          }}
        >
          <Grid
            p={2}
            pb={4}
            pt={databaseStatus === "disabled" ? 4 : 2}
            bg="muted"
            sx={{
              borderRadius: "4px",
              minHeight: layout.screenSize === "large" ? "600px" : "400px",
            }}
            gap={2}
            columns={layout.gridTemplate}
            onClick={() => onTokenSelect()}
          >
            {groups.map((group) => (
              <Sortable id={group.id} key={group.id}>
                {groupToTokenTile(group)}
              </Sortable>
            ))}
          </Grid>
        </SimpleBar>
        {databaseStatus === "disabled" && (
          <Box
            sx={{
              position: "absolute",
              top: "39px",
              left: 0,
              right: 0,
              textAlign: "center",
              borderRadius: "2px",
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
                aria-label={hideTitle}
                title={hideTitle}
                disabled={hasSelectedDefaultToken}
                onClick={() => onTokensHide(allTokensVisible)}
              >
                {allTokensVisible ? <TokenShowIcon /> : <TokenHideIcon />}
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
    </SortableTiles>
  );
}

export default TokenTiles;
