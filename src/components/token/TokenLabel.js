import React, { useRef, useEffect, useState } from "react";
import { Rect, Text, Group } from "react-konva";

import useSetting from "../../helpers/useSetting";

const maxTokenSize = 3;

function TokenLabel({ tokenState, width, height }) {
  const [labelSize] = useSetting("map.labelSize");

  const paddingY =
    (height / 12 / tokenState.size) * Math.min(tokenState.size, maxTokenSize);
  const paddingX =
    (height / 8 / tokenState.size) * Math.min(tokenState.size, maxTokenSize);

  const [fontSize, setFontSize] = useState(1);
  useEffect(() => {
    const text = textSizerRef.current;

    if (!text) {
      return;
    }

    let fontSizes = [];
    for (let size = 10 * labelSize; size >= 6; size--) {
      fontSizes.push(
        (height / size / tokenState.size) *
          Math.min(tokenState.size, maxTokenSize) *
          labelSize
      );
    }

    function findFontSize() {
      const size = fontSizes.reduce((prev, curr) => {
        text.fontSize(curr);
        const textWidth = text.getTextWidth() + paddingX * 2;
        if (textWidth < width) {
          return curr;
        } else {
          return prev;
        }
      });

      setFontSize(size);
    }

    findFontSize();
  }, [width, height, tokenState, labelSize, paddingX]);

  const [rectWidth, setRectWidth] = useState(0);
  useEffect(() => {
    const text = textRef.current;
    if (text && tokenState.label) {
      setRectWidth(text.getTextWidth() + paddingX * 2);
    } else {
      setRectWidth(0);
    }
  }, [tokenState.label, paddingX, width, fontSize]);

  const textRef = useRef();
  const textSizerRef = useRef();

  return (
    <Group y={height - (fontSize + paddingY) / 2}>
      <Rect
        y={-paddingY / 2}
        width={rectWidth}
        offsetX={width / 2}
        x={width - rectWidth / 2}
        height={fontSize + paddingY}
        fill="hsla(230, 25%, 18%, 0.8)"
        cornerRadius={(fontSize + paddingY) / 2}
      />
      <Text
        ref={textRef}
        width={width}
        text={tokenState.label}
        fontSize={fontSize}
        lineHeight={1}
        align="center"
        verticalAlign="bottom"
        fill="white"
        paddingX={paddingX}
        paddingY={paddingY}
        wrap="none"
        ellipsis={false}
        hitFunc={() => {}}
      />
      {/* Use an invisible text block to work out text sizing */}
      <Text
        visible={false}
        ref={textSizerRef}
        text={tokenState.label}
        wrap="none"
      />
    </Group>
  );
}

export default TokenLabel;
