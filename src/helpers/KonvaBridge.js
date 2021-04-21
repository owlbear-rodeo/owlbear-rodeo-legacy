import React, { useContext } from "react";

import {
  InteractionEmitterContext,
  SetPreventMapInteractionContext,
  StageWidthContext,
  StageHeightContext,
  MapWidthContext,
  MapHeightContext,
  StageScaleContext,
  DebouncedStageScaleContext,
  useInteractionEmitter,
  useSetPreventMapInteraction,
  useStageWidth,
  useStageHeight,
  useMapWidth,
  useMapHeight,
  useStageScale,
  useDebouncedStageScale,
} from "../contexts/MapInteractionContext";
import { MapStageProvider, useMapStage } from "../contexts/MapStageContext";
import AuthContext, { useAuth } from "../contexts/AuthContext";
import SettingsContext, { useSettings } from "../contexts/SettingsContext";
import KeyboardContext from "../contexts/KeyboardContext";
import TokenDataContext, { useTokenData } from "../contexts/TokenDataContext";
import {
  ImageSourcesStateContext,
  ImageSourcesUpdaterContext,
} from "../contexts/ImageSourceContext";
import {
  useGrid,
  useGridCellPixelSize,
  useGridCellNormalizedSize,
  useGridStrokeWidth,
  useGridCellPixelOffset,
  useGridOffset,
  useGridPixelSize,
  GridContext,
  GridPixelSizeContext,
  GridCellPixelSizeContext,
  GridCellNormalizedSizeContext,
  GridOffsetContext,
  GridStrokeWidthContext,
  GridCellPixelOffsetContext,
} from "../contexts/GridContext";

/**
 * Provide a bridge for konva that forwards our contexts
 */
function KonvaBridge({ stageRender, children }) {
  const mapStageRef = useMapStage();
  const auth = useAuth();
  const settings = useSettings();
  const tokenData = useTokenData();
  const imageSources = useContext(ImageSourcesStateContext);
  const setImageSources = useContext(ImageSourcesUpdaterContext);
  const keyboardValue = useContext(KeyboardContext);

  const stageScale = useStageScale();
  const stageWidth = useStageWidth();
  const stageHeight = useStageHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();
  const debouncedStageScale = useDebouncedStageScale();

  const grid = useGrid();
  const gridPixelSize = useGridPixelSize();
  const gridCellNormalizedSize = useGridCellNormalizedSize();
  const gridCellPixelSize = useGridCellPixelSize();
  const gridStrokeWidth = useGridStrokeWidth();
  const gridCellPixelOffset = useGridCellPixelOffset();
  const gridOffset = useGridOffset();

  return stageRender(
    <AuthContext.Provider value={auth}>
      <SettingsContext.Provider value={settings}>
        <KeyboardContext.Provider value={keyboardValue}>
          <MapStageProvider value={mapStageRef}>
            <TokenDataContext.Provider value={tokenData}>
              <ImageSourcesStateContext.Provider value={imageSources}>
                <ImageSourcesUpdaterContext.Provider value={setImageSources}>
                  <InteractionEmitterContext.Provider
                    value={interactionEmitter}
                  >
                    <SetPreventMapInteractionContext.Provider
                      value={setPreventMapInteraction}
                    >
                      <StageWidthContext.Provider value={stageWidth}>
                        <StageHeightContext.Provider value={stageHeight}>
                          <MapWidthContext.Provider value={mapWidth}>
                            <MapHeightContext.Provider value={mapHeight}>
                              <StageScaleContext.Provider value={stageScale}>
                                <DebouncedStageScaleContext.Provider
                                  value={debouncedStageScale}
                                >
                                  <GridContext.Provider value={grid}>
                                    <GridPixelSizeContext.Provider
                                      value={gridPixelSize}
                                    >
                                      <GridCellPixelSizeContext.Provider
                                        value={gridCellPixelSize}
                                      >
                                        <GridCellNormalizedSizeContext.Provider
                                          value={gridCellNormalizedSize}
                                        >
                                          <GridOffsetContext.Provider
                                            value={gridOffset}
                                          >
                                            <GridStrokeWidthContext.Provider
                                              value={gridStrokeWidth}
                                            >
                                              <GridCellPixelOffsetContext.Provider
                                                value={gridCellPixelOffset}
                                              >
                                                {children}
                                              </GridCellPixelOffsetContext.Provider>
                                            </GridStrokeWidthContext.Provider>
                                          </GridOffsetContext.Provider>
                                        </GridCellNormalizedSizeContext.Provider>
                                      </GridCellPixelSizeContext.Provider>
                                    </GridPixelSizeContext.Provider>
                                  </GridContext.Provider>
                                </DebouncedStageScaleContext.Provider>
                              </StageScaleContext.Provider>
                            </MapHeightContext.Provider>
                          </MapWidthContext.Provider>
                        </StageHeightContext.Provider>
                      </StageWidthContext.Provider>
                    </SetPreventMapInteractionContext.Provider>
                  </InteractionEmitterContext.Provider>
                </ImageSourcesUpdaterContext.Provider>
              </ImageSourcesStateContext.Provider>
            </TokenDataContext.Provider>
          </MapStageProvider>
        </KeyboardContext.Provider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}

export default KonvaBridge;
