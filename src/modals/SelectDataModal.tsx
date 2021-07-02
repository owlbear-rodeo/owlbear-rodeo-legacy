import React, { useEffect, useState } from "react";
import { Box, Label, Flex, Button, Text, Checkbox } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";
import Divider from "../components/Divider";

import { getDatabase } from "../database";

type SelectDataProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  onConfirm: any;
  confirmText: string;
  label: string;
  databaseName: string;
  filter: any;
};

type SelectData = {
  name: string;
  id: string;
  type: "default" | "file";
  checked: boolean;
};

function SelectDataModal({
  isOpen,
  onRequestClose,
  onConfirm,
  confirmText,
  label,
  databaseName,
  filter,
}: SelectDataProps) {
  const [maps, setMaps] = useState<Record<string, SelectData>>({});
  const [mapGroups, setMapGroups] = useState<any[]>([]);
  const [tokensByMap, setTokensByMap] = useState<Record<string, Set<string>>>(
    {}
  );
  const [tokens, setTokens] = useState<Record<string, SelectData>>({});
  const [tokenGroups, setTokenGroups] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const hasMaps = Object.values(maps).length > 0;
  const hasTokens = Object.values(tokens).length > 0;

  useEffect(() => {
    async function loadData() {
      if (isOpen && databaseName) {
        setIsLoading(true);
        const db = getDatabase({ addons: [] }, databaseName);
        let loadedMaps: Record<string, SelectData> = {};
        let loadedTokensByMap: Record<string, Set<string>> = {};
        let loadedTokens: Record<string, SelectData> = {};
        await db
          .table("maps")
          .filter((map) => filter("maps", map, map.id))
          .each((map) => {
            loadedMaps[map.id] = {
              name: map.name,
              id: map.id,
              type: map.type,
              checked: true,
            };
          });
        await db
          .table("states")
          .filter((state) => filter("states", state, state.mapId))
          .each((state) => {
            loadedTokensByMap[state.mapId] = new Set(
              Object.values(state.tokens).map(
                (tokenState: any) => tokenState.tokenId
              )
            );
          });

        await db
          .table("tokens")
          .filter((token) => filter("tokens", token, token.id))
          .each((token) => {
            loadedTokens[token.id] = {
              name: token.name,
              id: token.id,
              type: token.type,
              checked: true,
            };
          });

        const mapGroup = await db.table("groups").get("maps");
        const tokenGroup = await db.table("groups").get("tokens");

        db.close();
        setMaps(loadedMaps);
        setMapGroups(mapGroup.items);
        setTokensByMap(loadedTokensByMap);
        setTokenGroups(tokenGroup.items);
        setTokens(loadedTokens);
        setIsLoading(false);
      } else {
        setMaps({});
        setTokens({});
        setTokenGroups([]);
        setMapGroups([]);
        setTokensByMap({});
      }
    }
    loadData();
  }, [isOpen, databaseName, filter]);

  // An object mapping a tokenId to how many checked maps it is currently used in
  const [tokenUsedCount, setTokenUsedCount] = useState<any>({});
  useEffect(() => {
    let tokensUsed: any = {};
    for (let mapId in maps) {
      if (maps[mapId].checked && mapId in tokensByMap) {
        for (let tokenId of tokensByMap[mapId]) {
          if (tokenId in tokensUsed) {
            tokensUsed[tokenId] += 1;
          } else {
            tokensUsed[tokenId] = 1;
          }
        }
      }
    }
    setTokenUsedCount(tokensUsed);
    // Update tokens to ensure used tokens are checked
    setTokens((prevTokens: any) => {
      let newTokens = { ...prevTokens };
      for (let id in newTokens) {
        if (id in tokensUsed && newTokens[id].type !== "default") {
          newTokens[id].checked = true;
        }
      }
      return newTokens;
    });
  }, [maps, tokensByMap]);

  function getCheckedGroups(groups: any[], data: Record<string, SelectData>) {
    let checkedGroups = [];
    for (let group of groups) {
      if (group.type === "item") {
        if (data[group.id] && data[group.id].checked) {
          checkedGroups.push(group);
        }
      } else {
        let items = [];
        for (let item of group.items) {
          if (data[item.id] && data[item.id].checked) {
            items.push(item);
          }
        }
        if (items.length > 0) {
          checkedGroups.push({ ...group, items });
        }
      }
    }
    return checkedGroups;
  }

  function handleConfirm() {
    let checkedMaps = Object.values(maps).filter((map) => map.checked);
    let checkedTokens = Object.values(tokens).filter((token) => token.checked);
    let checkedMapGroups = getCheckedGroups(mapGroups, maps);
    let checkedTokenGroups = getCheckedGroups(tokenGroups, tokens);

    onConfirm(checkedMaps, checkedTokens, checkedMapGroups, checkedTokenGroups);
  }

  function handleMapsChanged(
    event: React.ChangeEvent<HTMLInputElement>,
    maps: SelectData[]
  ) {
    setMaps((prevMaps) => {
      let newMaps = { ...prevMaps };
      for (let map of maps) {
        newMaps[map.id].checked = event.target.checked;
      }
      return newMaps;
    });
    // If all token select is unchecked then ensure all tokens are unchecked
    if (!event.target.checked && !tokensSelectChecked) {
      setTokens((prevTokens: any) => {
        let newTokens = { ...prevTokens };
        let tempUsedCount = { ...tokenUsedCount };
        for (let id in newTokens) {
          for (let map of maps) {
            if (tokensByMap[map.id].has(id)) {
              if (tempUsedCount[id] > 1) {
                tempUsedCount[id] -= 1;
              } else if (tempUsedCount[id] === 1) {
                tempUsedCount[id] = 0;
                newTokens[id].checked = false;
              }
            }
          }
        }
        return newTokens;
      });
    }
  }

  function handleTokensChanged(
    event: React.ChangeEvent<HTMLInputElement>,
    tokens: SelectData[]
  ) {
    setTokens((prevTokens) => {
      let newTokens = { ...prevTokens };
      for (let token of tokens) {
        if (!(token.id in tokenUsedCount) || token.type === "default") {
          newTokens[token.id].checked = event.target.checked;
        }
      }
      return newTokens;
    });
  }

  // Some tokens are checked not by maps or all tokens are checked by maps
  const tokensSelectChecked =
    Object.values(tokens).some(
      (token: any) => !(token.id in tokenUsedCount) && token.checked
    ) ||
    Object.values(tokens).every((token: any) => token.id in tokenUsedCount);

  function renderGroupContainer(
    group: any,
    checked: boolean,
    renderItem: (group: any) => React.ReactNode,
    onGroupChange: (
      event: React.ChangeEvent<HTMLInputElement>,
      group: any
    ) => void
  ) {
    return (
      <Flex
        ml={4}
        sx={{
          flexWrap: "wrap",
          borderRadius: "4px",
          flexDirection: "column",
          position: "relative",
        }}
        key={group.id}
      >
        <Label my={1} sx={{ fontFamily: "body2" }}>
          <Checkbox
            checked={checked}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGroupChange(e, group)
            }
          />
          {group.name}
        </Label>
        <Flex
          sx={{
            flexWrap: "wrap",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {group.items.map(renderItem)}
          <Box
            sx={{ position: "absolute", left: "2px", top: 0, height: "100%" }}
          >
            <Divider vertical fill />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function renderMapGroup(group: any) {
    if (group.type === "item") {
      const map = maps[group.id];
      if (map) {
        return (
          <Label key={map.id} my={1} pl={4} sx={{ fontFamily: "body2" }}>
            <Checkbox
              checked={map.checked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleMapsChanged(e, [map])
              }
            />
            {map.name}
          </Label>
        );
      }
    } else {
      if (group.items.some((item: any) => item.id in maps)) {
        return renderGroupContainer(
          group,
          group.items.some((item: any) => maps[item.id]?.checked),
          renderMapGroup,
          (e, group) =>
            handleMapsChanged(
              e,
              group.items
                .filter((group: any) => group.id in maps)
                .map((group: any) => maps[group.id])
            )
        );
      }
    }
  }

  function renderTokenGroup(group: any) {
    if (group.type === "item") {
      const token = tokens[group.id];
      if (token) {
        return (
          <Box pl={4} my={1} key={token.id}>
            <Label sx={{ fontFamily: "body2" }}>
              <Checkbox
                checked={token.checked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleTokensChanged(e, [token])
                }
                disabled={
                  token.type !== "default" && token.id in tokenUsedCount
                }
              />
              {token.name}
            </Label>
            {token.id in tokenUsedCount && token.type !== "default" && (
              <Text as="p" variant="caption" ml={4}>
                Token used in {tokenUsedCount[token.id]} selected map
                {tokenUsedCount[token.id] > 1 && "s"}
              </Text>
            )}
          </Box>
        );
      }
    } else {
      if (group.items.some((item: any) => item.id in tokens)) {
        const checked =
          group.items.some(
            (item: any) =>
              !(item.id in tokenUsedCount) && tokens[item.id]?.checked
          ) || group.items.every((item: any) => item.id in tokenUsedCount);
        return renderGroupContainer(
          group,
          checked,
          renderTokenGroup,
          (e, group) =>
            handleTokensChanged(
              e,
              group.items
                .filter((group: any) => group.id in tokens)
                .map((group: any) => tokens[group.id])
            )
        );
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: { maxWidth: "450px", width: "100%" } }}
    >
      <Box
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          flexGrow: 1,
        }}
      >
        <Label py={2}>{label}</Label>
        {!hasMaps && !hasTokens && (
          <Text as="p" mb={2} variant="caption">
            No custom maps or tokens found.
          </Text>
        )}
        <SimpleBar style={{ maxHeight: "300px" }}>
          <Flex
            p={2}
            bg="muted"
            sx={{
              flexWrap: "wrap",
              borderRadius: "4px",
              flexDirection: "column",
            }}
          >
            {hasMaps && (
              <>
                <Flex>
                  <Label>
                    <Checkbox
                      checked={Object.values(maps).some((map) => map.checked)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleMapsChanged(e, Object.values(maps))
                      }
                    />
                    Maps
                  </Label>
                </Flex>
                {mapGroups.map(renderMapGroup)}
              </>
            )}
            {hasMaps && hasTokens && <Divider fill />}
            {hasTokens && (
              <>
                <Label>
                  <Checkbox
                    checked={tokensSelectChecked}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleTokensChanged(e, Object.values(tokens))
                    }
                  />
                  Tokens
                </Label>
                {tokenGroups.map(renderTokenGroup)}
              </>
            )}
          </Flex>
        </SimpleBar>
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }} m={1} ml={0} onClick={onRequestClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !Object.values(maps).some((map: any) => map.checked) &&
              !Object.values(tokens).some((token: any) => token.checked)
            }
            sx={{ flexGrow: 1 }}
            m={1}
            mr={0}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </Flex>
        {isLoading && <LoadingOverlay bg="overlay" />}
      </Box>
    </Modal>
  );
}

SelectDataModal.defaultProps = {
  label: "Select data",
  confirmText: "Yes",
  filter: () => true,
  databaseName: "OwlbearRodeoDB",
};

export default SelectDataModal;
