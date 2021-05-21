import React, { useState, useEffect } from "react";
import { Flex, Box, Text, IconButton, Close, Grid } from "theme-ui";
import SimpleBar from "simplebar-react";

import RemoveTokenIcon from "../../icons/RemoveTokenIcon";
import TokenHideIcon from "../../icons/TokenHideIcon";
import TokenShowIcon from "../../icons/TokenShowIcon";

import TokenTile from "./TokenTile";
import TokenTileGroup from "./TokenTileGroup";
import Link from "../Link";
import FilterBar from "../FilterBar";

import SortableTiles from "../drag/SortableTiles";

import useResponsiveLayout from "../../hooks/useResponsiveLayout";

import { groupsFromIds, itemsFromGroups } from "../../helpers/select";

function TokenTiles({
  tokens,
  groups,
  selectedGroupIds,
  onTileSelect,
  onTokenAdd,
  onTokenEdit,
  onTokensRemove,
  selectMode,
  onSelectModeChange,
  search,
  onSearchChange,
  onTokensGroup,
  onTokensHide,
  databaseDisabled,
}) {
  const layout = useResponsiveLayout();

  const [hasSelectedDefaultToken, setHasSelectedDefaultToken] = useState(false);
  const [allTokensVisible, setAllTokensVisisble] = useState(false);

  useEffect(() => {
    const selectedGroups = groupsFromIds(selectedGroupIds, groups);
    const selectedTokens = itemsFromGroups(selectedGroups, tokens);

    setHasSelectedDefaultToken(
      selectedTokens.some((token) => token.type === "default")
    );
    setAllTokensVisisble(selectedTokens.every((token) => !token.hideInSidebar));
  }, [selectedGroupIds, tokens, groups]);

  function renderTile(group) {
    if (group.type === "item") {
      const token = tokens.find((token) => token.id === group.id);
      const isSelected = selectedGroupIds.includes(group.id);
      return (
        <TokenTile
          key={token.id}
          token={token}
          isSelected={isSelected}
          onTokenSelect={onTileSelect}
          onTokenEdit={onTokenEdit}
          canEdit={
            isSelected &&
            token.type !== "default" &&
            selectMode === "single" &&
            selectedGroupIds.length === 1
          }
          badges={[`${token.defaultSize}x`]}
        />
      );
    } else {
      const isSelected = selectedGroupIds.includes(group.id);
      return (
        <TokenTileGroup
          key={group.id}
          group={group}
          tokens={group.items.map((item) =>
            tokens.find((token) => token.id === item.id)
          )}
          isSelected={isSelected}
          onSelect={onTileSelect}
        />
      );
    }
  }

  const multipleSelected = selectedGroupIds.length > 1;

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

  function renderTiles(tiles) {
    return (
      <Box sx={{ position: "relative" }}>
        <FilterBar
          onFocus={() => onTileSelect()}
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
            pt={databaseDisabled ? 4 : 2}
            bg="muted"
            sx={{
              borderRadius: "4px",
              minHeight: layout.screenSize === "large" ? "600px" : "400px",
            }}
            gap={2}
            columns={layout.gridTemplate}
            onClick={() => onTileSelect()}
          >
            {tiles}
          </Grid>
        </SimpleBar>
        {databaseDisabled && (
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
        {selectedGroupIds.length > 0 && (
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
              onClick={() => onTileSelect()}
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
    );
  }

  return (
    <SortableTiles
      groups={groups}
      onGroupChange={onTokensGroup}
      renderTile={renderTile}
      renderTiles={renderTiles}
    />
  );
}

export default TokenTiles;
