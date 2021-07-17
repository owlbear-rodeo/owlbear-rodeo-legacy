import Konva from "konva";
import { useRef, useEffect, useState } from "react";
import { Rect, Text, Group } from "react-konva";

import useSetting from "../../hooks/useSetting";
import { TokenState } from "../../types/TokenState";

const maxTokenSize = 3;
const defaultFontSize = 16;

type TokenLabelProps = {
  tokenState: TokenState;
  width: number;
  height: number;
};

function TokenLabel({ tokenState, width, height }: TokenLabelProps) {
  const [labelSize] = useSetting<number>("map.labelSize");

  const paddingY =
    (height / 12 / tokenState.size) * Math.min(tokenState.size, maxTokenSize);
  const paddingX =
    (height / 8 / tokenState.size) * Math.min(tokenState.size, maxTokenSize);

  const [fontScale, setFontScale] = useState(0);
  useEffect(() => {
    const text = textSizerRef.current;

    if (!text) {
      return;
    }

    let fontSizes: number[] = [];
    for (let size = 20 * labelSize; size >= 6; size--) {
      const verticalSize = height / size / tokenState.size;
      const tokenSize = Math.min(tokenState.size, maxTokenSize);
      const fontSize = verticalSize * tokenSize * labelSize;
      fontSizes.push(fontSize);
    }

    const findFontScale = () => {
      const size = fontSizes.reduce((prev, curr) => {
        text.fontSize(curr);
        const textWidth = text.getTextWidth() + paddingX * 2;
        if (textWidth < width) {
          return curr;
        } else {
          return prev;
        }
      }, 1);

      setFontScale(size / defaultFontSize);
    };

    findFontScale();
  }, [
    tokenState.label,
    tokenState.visible,
    width,
    height,
    tokenState,
    labelSize,
    paddingX,
  ]);

  const [rectWidth, setRectWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  useEffect(() => {
    const text = textRef.current;
    if (text && tokenState.label) {
      setRectWidth(text.getTextWidth() * fontScale + paddingX * 2);
      setTextWidth(text.getTextWidth() * fontScale);
    } else {
      setRectWidth(0);
      setTextWidth(0);
    }
  }, [tokenState.label, paddingX, width, fontScale]);

  const textRef = useRef<Konva.Text>(null);
  const textSizerRef = useRef<Konva.Text>(null);

  return (
    <Group y={height - (defaultFontSize * fontScale + paddingY) / 2}>
      <Rect
        y={-paddingY / 2}
        width={rectWidth}
        offsetX={width / 2}
        x={width - rectWidth / 2}
        height={defaultFontSize * fontScale + paddingY}
        fill="hsla(230, 25%, 18%, 0.8)"
        cornerRadius={(defaultFontSize * fontScale + paddingY) / 2}
      />
      <Group offsetX={(textWidth - width) / 2}>
        <Text
          ref={textRef}
          text={tokenState.label}
          fontSize={defaultFontSize}
          lineHeight={1}
          // Scale font instead of changing font size to avoid kerning issues with Firefox
          scaleX={fontScale}
          scaleY={fontScale}
          fill="white"
          wrap="none"
          ellipsis={false}
          hitFunc={() => {}}
        />
      </Group>
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
