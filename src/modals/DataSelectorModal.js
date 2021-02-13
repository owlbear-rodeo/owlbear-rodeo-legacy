import React, { useEffect, useState } from "react";
import { Box, Label, Flex, Button, Text, Checkbox, Divider } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import LoadingOverlay from "../components/LoadingOverlay";

import { getDatabase } from "../database";

function DataSelectorModal({
  isOpen,
  onRequestClose,
  onConfirm,
  confirmText,
  label,
  databaseName,
  filter,
}) {
  const [maps, setMaps] = useState({});
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
        let loadedTokens = {};
        await db
          .table("maps")
          .filter((map) => filter("maps", map, map.id))
          .each((map) => {
            loadedMaps[map.id] = { name: map.name, id: map.id, checked: true };
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
        setTokens(loadedTokens);
        setIsLoading(false);
      } else {
        setMaps({});
        setTokens({});
      }
    }
    loadData();
  }, [isOpen, databaseName, filter]);

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
                      (token) => token.checked
                    )}
                    onChange={(e) =>
                      setTokens((prevTokens) => {
                        let newTokens = { ...prevTokens };
                        for (let id in newTokens) {
                          newTokens[id].checked = e.target.checked;
                        }
                        return newTokens;
                      })
                    }
                  />
                  Tokens
                </Label>
                {Object.values(tokens).map((token) => (
                  <Label
                    key={token.id}
                    my={1}
                    pl={4}
                    sx={{ fontFamily: "body2" }}
                  >
                    <Checkbox
                      checked={token.checked}
                      onChange={(e) =>
                        setTokens((prevTokens) => ({
                          ...prevTokens,
                          [token.id]: { ...token, checked: e.target.checked },
                        }))
                      }
                    />
                    {token.name}
                  </Label>
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

DataSelectorModal.defaultProps = {
  label: "Select data",
  confirmText: "Yes",
  filter: () => true,
  databaseName: "OwlbearRodeoDB",
};

export default DataSelectorModal;
