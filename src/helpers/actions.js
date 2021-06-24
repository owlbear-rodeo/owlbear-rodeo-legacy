import shortid from "shortid";

export function addPolygonDifferenceToShapes(shape, difference, shapes) {
  for (let i = 0; i < difference.length; i++) {
    let newId = shortid.generate();
    // Holes detected
    let holes = [];
    if (difference[i].length > 1) {
      for (let j = 1; j < difference[i].length; j++) {
        holes.push(difference[i][j].map(([x, y]) => ({ x, y })));
      }
    }

    const points = difference[i][0].map(([x, y]) => ({ x, y }));

    shapes[newId] = {
      ...shape,
      id: newId,
      data: {
        points,
        holes,
      },
    };
  }
}

export function addPolygonIntersectionToShapes(shape, intersection, shapes) {
  for (let i = 0; i < intersection.length; i++) {
    let newId = shortid.generate();

    const points = intersection[i][0].map(([x, y]) => ({ x, y }));

    shapes[newId] = {
      ...shape,
      id: newId,
      data: {
        points,
        holes: [],
      },
      // Default intersection visibility to false
      visible: false,
    };
  }
}

export function shapeToGeometry(shape) {
  const shapePoints = shape.data.points.map(({ x, y }) => [x, y]);
  const shapeHoles = shape.data.holes.map((hole) =>
    hole.map(({ x, y }) => [x, y])
  );
  return [[shapePoints, ...shapeHoles]];
}
