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
  const width = radius / 3;
  const height = radius / 8;
  return (
    <Group>
      {/* Make a bigger hidden rect for hit registration */}
      <Rect
        width={width * 2}
        height={height * 2}
        x={-width}
        y={tokenHeight / 2 - height}
        cornerRadius={2.5}
        fill="transparent"
      />
      <Rect
        width={width}
        height={height}
        x={-width / 2}
        y={tokenHeight / 2 - height / 2}
        cornerRadius={2.5}
        fill="rgba(36, 39, 51, 0.8)"
        shadowColor="rgba(0,0,0,0.5)"
        shadowOffsetY={radius / 40}
        shadowBlur={radius / 15}
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
