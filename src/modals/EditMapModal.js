import React, { useState, useContext } from "react";
import { Button, Flex, Label } from "theme-ui";

import Modal from "../components/Modal";
import MapSettings from "../components/map/MapSettings";
import MapEditor from "../components/map/MapEditor";

import MapDataContext from "../contexts/MapDataContext";

import { isEmpty } from "../helpers/shared";
import { getMapDefaultInset } from "../helpers/grid";

import useResponsiveLayout from "../hooks/useResponsiveLayout";

function EditMapModal({ isOpen, onDone, map, mapState }) {
  const { updateMap, updateMapState } = useContext(MapDataContext);

  function handleClose() {
    setMapSettingChanges({});
    setMapStateSettingChanges({});
    onDone();
  }

  async function handleSave() {
    await applyMapChanges();
    onDone();
  }

  /**
   * Map settings
   */
  // Local cache of map setting changes
  // Applied when done is clicked or map selection is changed
  const [mapSettingChanges, setMapSettingChanges] = useState({});
  const [mapStateSettingChanges, setMapStateSettingChanges] = useState({});

  function handleMapSettingsChange(key, value) {
    setMapSettingChanges((prevChanges) => ({
      ...prevChanges,
      [key]: value,
      lastModified: Date.now(),
    }));
  }

  function handleMapStateSettingsChange(key, value) {
    setMapStateSettingChanges((prevChanges) => ({
      ...prevChanges,
      [key]: value,
    }));
  }

  async function applyMapChanges() {
    if (!isEmpty(mapSettingChanges) || !isEmpty(mapStateSettingChanges)) {
      // Ensure grid values are positive
      let verifiedChanges = { ...mapSettingChanges };
      if ("grid" in verifiedChanges && "size" in verifiedChanges.grid) {
        verifiedChanges.grid.size.x = verifiedChanges.grid.size.x || 1;
        verifiedChanges.grid.size.y = verifiedChanges.grid.size.y || 1;
      }
      // Ensure inset isn't flipped
      if ("grid" in verifiedChanges && "inset" in verifiedChanges.grid) {
        const inset = verifiedChanges.grid.inset;
        if (
          inset.topLeft.x > inset.bottomRight.x ||
          inset.topLeft.y > inset.bottomRight.y
        ) {
          if ("size" in verifiedChanges.grid) {
            verifiedChanges.grid.inset = getMapDefaultInset(
              map.width,
              map.height,
              verifiedChanges.grid.size.x,
              verifiedChanges.grid.size.y
            );
          } else {
            verifiedChanges.grid.inset = getMapDefaultInset(
              map.width,
              map.height,
              map.grid.size.x,
              map.grid.size.y
            );
          }
        }
      }
      await updateMap(map.id, mapSettingChanges);
      await updateMapState(map.id, mapStateSettingChanges);

      setMapSettingChanges({});
      setMapStateSettingChanges({});
    }
  }

  const selectedMapWithChanges = map && {
    ...map,
    ...mapSettingChanges,
  };
  const selectedMapStateWithChanges = mapState && {
    ...mapState,
    ...mapStateSettingChanges,
  };

  const [showMoreSettings, setShowMoreSettings] = useState(true);

  const layout = useResponsiveLayout();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{ maxWidth: layout.modalSize, width: "calc(100% - 16px)" }}
    >
      <Flex
        sx={{
          flexDirection: "column",
        }}
      >
        <Label pt={2} pb={1}>
          Edit map
        </Label>
        <MapEditor
          map={selectedMapWithChanges}
          onSettingsChange={handleMapSettingsChange}
        />
        <MapSettings
          map={selectedMapWithChanges}
          mapState={selectedMapStateWithChanges}
          onSettingsChange={handleMapSettingsChange}
          onStateSettingsChange={handleMapStateSettingsChange}
          showMore={showMoreSettings}
          onShowMoreChange={setShowMoreSettings}
        />
        <Button onClick={handleSave}>Save</Button>
      </Flex>
    </Modal>
  );
}

export default EditMapModal;
