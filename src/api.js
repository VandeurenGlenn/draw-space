import objects from './objects.js';
import 'fabric';
// const { Circle, Canvas } = fabric
const drawCircle = (top, left) => {
  const circle = objects.circle
  circle.top = top
  circle.left = left
  return new fabric.Circle(circle)
}

const drawLine = (coords) => {
  const line = objects.line
  // line.top = top
  // line.left = left
  return new fabric.Line(line.coordinates, line)
}

export { drawCircle, drawLine }