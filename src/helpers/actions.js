export function addPolygonDifferenceToShapes(shape, difference, shapes) {
  for (let i = 0; i < difference.length; i++) {
    let newId = `${shape.id}-dif-${i}`;
    // Holes detected
    let holes = [];
    if (difference[i].length > 1) {
      for (let j = 1; j < difference[i].length; j++) {
        holes.push(difference[i][j].map(([x, y]) => ({ x, y })));
      }
    }

    shapes[newId] = {
      ...shape,
      id: newId,
      data: {
        points: difference[i][0].map(([x, y]) => ({ x, y })),
        holes,
      },
    };
  }
}

export function addPolygonIntersectionToShapes(shape, intersection, shapes) {
  for (let i = 0; i < intersection.length; i++) {
    let newId = `${shape.id}-int-${i}`;
    shapes[newId] = {
      ...shape,
      id: newId,
      data: {
        points: intersection[i][0].map(([x, y]) => ({ x, y })),
        holes: [],
      },
      // Default intersection visibility to false
      visible: false,
    };
  }
}
