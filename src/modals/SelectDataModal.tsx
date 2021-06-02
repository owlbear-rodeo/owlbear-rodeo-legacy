import { ChangeEvent, useEffect, useState } from "react";
import { Box, Label, Flex, Button, Text, Checkbox, Divider } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";

import { getDatabase } from "../database";
import { Props } from "react-modal";

type SelectDataProps = Props & {
  onConfirm: any,
  confirmText: string,
  label: string,
  databaseName: string,
  filter: any,
}

function SelectDataModal({
  isOpen,
  onRequestClose,
  onConfirm,
  confirmText,
  label,
  databaseName,
  filter,
}: SelectDataProps) {
  const [maps, setMaps] = useState<any>({});
  const [tokensByMap, setTokensByMap] = useState<any>({});
  const [tokens, setTokens] = useState<any>({});

  const [isLoading, setIsLoading] = useState(false);
  const hasMaps = Object.values(maps).length > 0;
  const hasTokens = Object.values(tokens).length > 0;

  useEffect(() => {
    async function loadData() {
      if (isOpen && databaseName) {
        setIsLoading(true);
        const db = getDatabase({ addons: [] }, databaseName);
        let loadedMaps: any = [];
        let loadedTokensByMap: any = {};
        let loadedTokens: any = [];
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
        if (id in tokensUsed) {
          newTokens[id].checked = true;
        }
      }
      return newTokens;
    });
  }, [maps, tokensByMap]);

  function handleConfirm() {
    let checkedMaps = Object.values(maps).filter((map: any) => map.checked);
    let checkedTokens = Object.values(tokens).filter((token: any) => token.checked);
    onConfirm(checkedMaps, checkedTokens);
  }

  function handleSelectMapsChanged(event: ChangeEvent<HTMLInputElement>) {
    setMaps((prevMaps: any) => {
      let newMaps = { ...prevMaps };
      for (let id in newMaps) {
        newMaps[id].checked = event.target.checked;
      }
      return newMaps;
    });
    // If all token select is unchecked then ensure all tokens are unchecked
    if (!event.target.checked && !tokensSelectChecked) {
      setTokens((prevTokens: any) => {
        let newTokens = { ...prevTokens };
        for (let id in newTokens) {
          newTokens[id].checked = false;
        }
        return newTokens;
      });
    }
  }

  function handleMapChange(event: ChangeEvent<HTMLInputElement>, map: any) {
    setMaps((prevMaps: any) => ({
      ...prevMaps,
      [map.id]: { ...map, checked: event.target.checked },
    }));
    // If all token select is unchecked then ensure tokens assosiated to this map are unchecked
    if (!event.target.checked && !tokensSelectChecked) {
      setTokens((prevTokens: any) => {
        let newTokens = { ...prevTokens };
        for (let id in newTokens) {
          if (tokensByMap[map.id].has(id) && tokenUsedCount[id] === 1) {
            newTokens[id].checked = false;
          }
        }
        return newTokens;
      });
    }
  }

  function handleSelectTokensChange(event: ChangeEvent<HTMLInputElement>) {
    setTokens((prevTokens: any) => {
      let newTokens = { ...prevTokens };
      for (let id in newTokens) {
        if (!(id in tokenUsedCount)) {
          newTokens[id].checked = event.target.checked;
        }
      }
      return newTokens;
    });
  }

  function handleTokenChange(event: ChangeEvent<HTMLInputElement>, token: any) {
    setTokens((prevTokens: any) => ({
      ...prevTokens,
      [token.id]: { ...token, checked: event.target.checked },
    }));
  }

  // Some tokens are checked not by maps or all tokens are checked by maps
  const tokensSelectChecked =
    Object.values(tokens).some(
      (token: any) => !(token.id in tokenUsedCount) && token.checked
    ) || Object.values(tokens).every((token: any) => token.id in tokenUsedCount);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ content: {maxWidth: "450px", width: "100%"} }}
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
                      checked={Object.values(maps).some((map: any) => map.checked)}
                      onChange={handleSelectMapsChanged}
                    />
                    Maps
                  </Label>
                </Flex>
                {Object.values(maps).map((map: any) => (
                  <Label
                    key={map.id}
                    my={1}
                    pl={4}
                    sx={{ fontFamily: "body2" }}
                  >
                    <Checkbox
                      checked={map.checked}
                      onChange={(e) => handleMapChange(e, map)}
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
                    checked={tokensSelectChecked}
                    onChange={handleSelectTokensChange}
                  />
                  Tokens
                </Label>
                {Object.values(tokens).map((token: any) => (
                  <Box pl={4} my={1} key={token.id}>
                    <Label sx={{ fontFamily: "body2" }}>
                      <Checkbox
                        checked={token.checked}
                        onChange={(e) => handleTokenChange(e, token)}
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
