import { useState } from "react";
import { Button, Flex, Label, useThemeUI } from "theme-ui";
import SimpleBar from "simplebar-react";

import Modal from "../components/Modal";
import MapSettings from "../components/map/MapSettings";
import MapEditor from "../components/map/MapEditor";

import { isEmpty } from "../helpers/shared";
import { getGridDefaultInset } from "../helpers/grid";

import useResponsiveLayout from "../hooks/useResponsiveLayout";
import { Map, MapState } from "../components/map/Map";

type EditMapProps = {
  isOpen: boolean;
  onDone: () => void;
  map: Map;
  mapState: MapState;
  onUpdateMap: (id: string, update: Partial<Map>) => void;
  onUpdateMapState: (id: string, update: Partial<MapState>) => void;
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
  const [mapSettingChanges, setMapSettingChanges] = useState<any>({});
  const [mapStateSettingChanges, setMapStateSettingChanges] = useState<any>({});

  function handleMapSettingsChange(key: string, value: string) {
    setMapSettingChanges((prevChanges: any) => ({
      ...prevChanges,
      [key]: value,
      lastModified: Date.now(),
    }));
  }

  function handleMapStateSettingsChange(key: string, value: string) {
    setMapStateSettingChanges((prevChanges: any) => ({
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
            verifiedChanges.grid.inset = getGridDefaultInset(
              { size: verifiedChanges.grid.size, type: map.grid.type },
              map.width,
              map.height
            );
          } else {
            verifiedChanges.grid.inset = getGridDefaultInset(
              map.grid,
              map.width,
              map.height
            );
          }
        }
      }
      await onUpdateMap(map.id, mapSettingChanges);
      await onUpdateMapState(map.id, mapStateSettingChanges);

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
            backgroundColor: theme.colors.muted,
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
