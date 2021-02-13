import React, { useEffect, useState } from "react";
import { Box, Label, Flex, Button, Text, Checkbox, Divider } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";

import { getDatabase } from "../database";

function SelectDataModal({
  isOpen,
  onRequestClose,
  onConfirm,
  confirmText,
  label,
  databaseName,
  filter,
}) {
  const [maps, setMaps] = useState({});
  const [tokensByMap, setTokensByMap] = useState({});
  const [tokens, setTokens] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const hasMaps = Object.values(maps).length > 0;
  const hasTokens = Object.values(tokens).length > 0;

  useEffect(() => {
    async function loadData() {
      if (isOpen && databaseName) {
        setIsLoading(true);
        const db = getDatabase({}, databaseName);
        let loadedMaps = {};
        let loadedTokensByMap = {};
        let loadedTokens = {};
        await db
          .table("maps")
          .filter((map) => filter("maps", map, map.id))
          .each((map) => {
            loadedMaps[map.id] = { name: map.name, id: map.id, checked: true };
          });
        await db
          .table("states")
          .filter((state) => filter("states", state, state.mapId))
          .each((state) => {
            loadedTokensByMap[state.mapId] = new Set(
              Object.values(state.tokens).map(
                (tokenState) => tokenState.tokenId
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
              checked: true,
            };
          });
        db.close();
        setMaps(loadedMaps);
        setTokensByMap(loadedTokensByMap);
        setTokens(loadedTokens);
        setIsLoading(false);
      } else {
        setMaps({});
        setTokens({});
      }
    }
    loadData();
  }, [isOpen, databaseName, filter]);

  // An object mapping a tokenId to how many checked maps it is currently used in
  const [tokenUsedCount, setTokenUsedCount] = useState({});
  useEffect(() => {
    let tokensUsed = {};
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
    setTokens((prevTokens) => {
      let newTokens = { ...prevTokens };
      for (let id in newTokens) {
        if (id in tokensUsed) {
          newTokens[id].checked = true;
        }
      }
      return newTokens;
    });
  }, [maps, tokensByMap]);

  function handleConfirm() {
    let checkedMaps = Object.values(maps).filter((map) => map.checked);
    let checkedTokens = Object.values(tokens).filter((token) => token.checked);
    onConfirm(checkedMaps, checkedTokens);
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ maxWidth: "450px", width: "100%" }}
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
                      onChange={(e) =>
                        setMaps((prevMaps) => {
                          let newMaps = { ...prevMaps };
                          for (let id in newMaps) {
                            newMaps[id].checked = e.target.checked;
                          }
                          return newMaps;
                        })
                      }
                    />
                    Maps
                  </Label>
                </Flex>
                {Object.values(maps).map((map) => (
                  <Label
                    key={map.id}
                    my={1}
                    pl={4}
                    sx={{ fontFamily: "body2" }}
                  >
                    <Checkbox
                      checked={map.checked}
                      onChange={(e) =>
                        setMaps((prevMaps) => ({
                          ...prevMaps,
                          [map.id]: { ...map, checked: e.target.checked },
                        }))
                      }
                    />
                    {map.name}
                  </Label>
                ))}
              </>
            )}
            {hasMaps && hasTokens && <Divider bg="text" />}
            {hasTokens && (
              <>
                <Label>
                  <Checkbox
                    checked={Object.values(tokens).some(
                      (token) => !(token.id in tokenUsedCount) && token.checked
                    )}
                    onChange={(e) =>
                      setTokens((prevTokens) => {
                        let newTokens = { ...prevTokens };
                        for (let id in newTokens) {
                          if (!(id in tokenUsedCount)) {
                            newTokens[id].checked = e.target.checked;
                          }
                        }
                        return newTokens;
                      })
                    }
                  />
                  Tokens
                </Label>
                {Object.values(tokens).map((token) => (
                  <Box pl={4} my={1} key={token.id}>
                    <Label sx={{ fontFamily: "body2" }}>
                      <Checkbox
                        checked={token.checked}
                        onChange={(e) =>
                          setTokens((prevTokens) => ({
                            ...prevTokens,
                            [token.id]: { ...token, checked: e.target.checked },
                          }))
                        }
                        disabled={token.id in tokenUsedCount}
                      />
                      {token.name}
                    </Label>
                    {token.id in tokenUsedCount && (
                      <Text as="p" variant="caption" ml={4}>
                        Token used in {tokenUsedCount[token.id]} selected map
                        {tokenUsedCount[token.id] > 1 && "s"}
                      </Text>
                    )}
                  </Box>
                ))}
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
              !Object.values(maps).some((map) => map.checked) &&
              !Object.values(tokens).some((token) => token.checked)
            }
            sx={{ flexGrow: 1 }}
            m={1}
            mr={0}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </Flex>
        {isLoading && <LoadingOverlay />}
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
