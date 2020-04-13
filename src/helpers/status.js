export function statusToColor(status) {
  switch (status) {
    case "blue":
      return "rgb(26, 106, 255)";
    case "orange":
      return "rgb(255, 116, 51)";
    case "red":
      return "rgb(255, 77, 77)";
    case "purple":
      return "rgb(136, 77, 255)";
    case "green":
      return "rgb(133, 255, 102)";
    case "pink":
      return "rgb(235, 138, 255)";
    default:
      throw Error("Color not implemented");
  }
}

export const statusOptions = [
  "blue",
  "orange",
  "red",
  "purple",
  "green",
  "pink",
];
