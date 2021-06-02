import { useEffect, useState } from "react";
import { Button, Flex, Label } from "theme-ui";

import Modal from "../components/Modal";
import MapSettings from "../components/map/MapSettings";
import MapEditor from "../components/map/MapEditor";
import LoadingOverlay from "../components/LoadingOverlay";

import { useMapData } from "../contexts/MapDataContext";

import { isEmpty } from "../helpers/shared";
import { getGridDefaultInset } from "../helpers/grid";

import useResponsiveLayout from "../hooks/useResponsiveLayout";
import { MapState } from "../components/map/Map";

type EditMapProps = {
  isOpen: boolean,
  onDone: any,
  mapId: string
}

function EditMapModal({ isOpen, onDone, mapId }: EditMapProps) {
  const {
    updateMap,
    updateMapState,
    getMap,
    getMapFromDB,
    getMapStateFromDB,
  } = useMapData();

  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<any>();
  const [mapState, setMapState] = useState<MapState>();
  // Load full map when modal is opened
  useEffect(() => {
    async function loadMap() {
      setIsLoading(true);
      let loadingMap = getMap(mapId);
      // Ensure file is loaded for map
      if (loadingMap?.type === "file" && !loadingMap?.file) {
        loadingMap = await getMapFromDB(mapId);
      }
      const mapState = await getMapStateFromDB(mapId);
      setMap(loadingMap);
      setMapState(mapState);
      setIsLoading(false);
    }

    if (isOpen && mapId) {
      loadMap();
    } else {
      setMap(undefined);
      setMapState(undefined);
    }
  }, [isOpen, mapId, getMapFromDB, getMapStateFromDB, getMap]);

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
      style={{ content: {maxWidth: layout.modalSize, width: "calc(100% - 16px)"} }}
    >
      <Flex
        sx={{
          flexDirection: "column",
        }}
      >
        <Label pt={2} pb={1}>
          Edit map
        </Label>
        {isLoading || !map ? (
          <Flex
            sx={{
              width: "100%",
              height: layout.screenSize === "large" ? "500px" : "300px",
              position: "relative",
            }}
            bg="muted"
          >
            <LoadingOverlay />
          </Flex>
        ) : (
          <MapEditor
            map={selectedMapWithChanges}
            onSettingsChange={handleMapSettingsChange}
          />
        )}
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
