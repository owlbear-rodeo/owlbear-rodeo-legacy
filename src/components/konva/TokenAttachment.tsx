import { Circle, Group, Rect } from "react-konva";

type TokenAttachmentProps = {
  tokenHeight: number;
  dragging: boolean;
  highlight: boolean;
  radius: number;
};

function TokenAttachment({
  tokenHeight,
  dragging,
  highlight,
  radius,
}: TokenAttachmentProps) {
  return (
    <Group>
      {/* Make a bigger hidden rect for hit registration */}
      <Rect
        width={10}
        height={5}
        x={-5}
        y={tokenHeight / 2 - 2.5}
        cornerRadius={2.5}
        fill="transparent"
      />
      <Rect
        width={5}
        height={2}
        x={-2.5}
        y={tokenHeight / 2 - 1}
        cornerRadius={2.5}
        fill="rgba(36, 39, 51, 0.5)"
        shadowColor="rgba(0,0,0,0.12)"
        shadowOffsetY={1}
        shadowBlur={2}
        hitFunc={() => {}}
      />
      {dragging ? (
        <Circle
          radius={radius}
          stroke={
            highlight ? "hsl(260, 100%, 80%)" : "rgba(255, 255, 255, 0.85)"
          }
          strokeWidth={0.5}
        />
      ) : null}
    </Group>
  );
}

export default TokenAttachment;
