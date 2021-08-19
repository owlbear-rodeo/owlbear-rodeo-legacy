import { Divider, DividerProps } from "theme-ui";

type StyledDividerProps = {
  vertical: boolean;
  fill: boolean;
} & DividerProps;

function StyledDivider({
  vertical,
  color,
  fill,
  ...props
}: StyledDividerProps) {
  return (
    <Divider
      my={vertical ? 0 : 2}
      mx={vertical ? 2 : 0}
      bg={color}
      sx={{
        height: vertical ? (fill ? "100%" : "24px") : "2px",
        width: vertical ? "2px" : fill ? "100%" : "24px",
        borderRadius: "2px",
        opacity: 0.5,
      }}
      {...props}
    />
  );
}

StyledDivider.defaultProps = {
  vertical: false,
  color: "text",
  fill: false,
};

export default StyledDivider;
