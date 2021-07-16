import { useState } from "react";
import { Button, Flex, Label, useThemeUI } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import MapSettings from "../components/map/MapSettings";
import MapEditor from "../components/map/MapEditor";

import { isEmpty } from "../helpers/shared";
import { getGridDefaultInset } from "../helpers/grid";

import useResponsiveLayout from "../hooks/useResponsiveLayout";
import { Map } from "../types/Map";
import { MapState } from "../types/MapState";
import {
  UpdateMapEventHanlder,
  UpdateMapStateEventHandler,
} from "../contexts/MapDataContext";

type EditMapProps = {
  isOpen: boolean;
  onDone: () => void;
  map: Map;
  mapState: MapState;
  onUpdateMap: UpdateMapEventHanlder;
  onUpdateMapState: UpdateMapStateEventHandler;
};

function EditMapModal({
  isOpen,
  onDone,
  map,
  mapState,
  onUpdateMap,
  onUpdateMapState,
}: EditMapProps) {
  const { theme } = useThemeUI();

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
  const [mapSettingChanges, setMapSettingChanges] = useState<Partial<Map>>({});
  const [mapStateSettingChanges, setMapStateSettingChanges] = useState<
    Partial<MapState>
  >({});

  function handleMapSettingsChange(change: Partial<Map>) {
    setMapSettingChanges((prevChanges) => ({
      ...prevChanges,
      ...change,
    }));
  }

  function handleMapStateSettingsChange(change: Partial<MapState>) {
    setMapStateSettingChanges((prevChanges) => ({
      ...prevChanges,
      ...change,
    }));
  }

  async function applyMapChanges() {
    if (!isEmpty(mapSettingChanges) || !isEmpty(mapStateSettingChanges)) {
      // Ensure grid values are positive
      let verifiedChanges: Partial<Map> = { ...mapSettingChanges };
      if (verifiedChanges.grid) {
        verifiedChanges.grid.size.x = verifiedChanges.grid.size.x || 1;
        verifiedChanges.grid.size.y = verifiedChanges.grid.size.y || 1;
      }
      // Ensure inset isn't flipped
      if (verifiedChanges.grid) {
        const inset = verifiedChanges.grid.inset;
        if (
          inset.topLeft.x > inset.bottomRight.x ||
          inset.topLeft.y > inset.bottomRight.y
        ) {
          verifiedChanges.grid.inset = getGridDefaultInset(
            { size: verifiedChanges.grid.size, type: map.grid.type },
            map.width,
            map.height
          );
        }
      }
      await onUpdateMap(map.id, mapSettingChanges);
      await onUpdateMapState(map.id, mapStateSettingChanges);

      setMapSettingChanges({});
      setMapStateSettingChanges({});
    }
  }

  const selectedMapWithChanges =
    map &&
    ({
      ...map,
      ...mapSettingChanges,
    } as Map);
  const selectedMapStateWithChanges: MapState = mapState && {
    ...mapState,
    ...mapStateSettingChanges,
  };

  const layout = useResponsiveLayout();

  if (!map) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{
        content: {
          maxWidth: layout.modalSize,
          width: "calc(100% - 16px)",
          padding: 0,
          display: "flex",
          overflow: "hidden",
        },
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Label pt={2} pb={1} px={3}>
          Edit map
        </Label>
        <SimpleBar
          style={{
            minHeight: 0,
            padding: "16px",
            backgroundColor: theme.colors?.muted as string,
            margin: "0 8px",
            height: "100%",
          }}
        >
          <MapEditor
            map={selectedMapWithChanges}
            onSettingsChange={handleMapSettingsChange}
          />
          <MapSettings
            map={selectedMapWithChanges}
            mapState={selectedMapStateWithChanges}
            onSettingsChange={handleMapSettingsChange}
            onStateSettingsChange={handleMapStateSettingsChange}
          />
        </SimpleBar>
        <Button m={3} onClick={handleSave}>
          Save
        </Button>
      </Flex>
    </Modal>
  );
}

export default EditMapModal;
