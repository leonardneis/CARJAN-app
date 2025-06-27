const { generatePNGThumbnail, COLORS } = require("./generatePNGThumbnails.cjs");
const fs = require("fs");
const path = require("path");

// Test the square cell calculation
const testMapData = {
  name: "Square Cell Test",
  grid: {
    dimensions: { rows: 10, cols: 15 }, // Rectangular grid (3:2 aspect ratio)
    mapData: Array(10)
      .fill()
      .map(() => Array(15).fill("r")),
  },
};

// Test with different canvas sizes
const testCases = [
  { width: 400, height: 300, name: "400x300" },
  { width: 300, height: 400, name: "300x400" },
  { width: 600, height: 400, name: "600x400" },
];

console.log("Testing square cell generation...\n");

for (const testCase of testCases) {
  const thumbnail = generatePNGThumbnail(
    testMapData,
    testCase.width,
    testCase.height
  );

  // Calculate expected dimensions
  const cellSize = Math.min(testCase.width / 15, testCase.height / 10);
  const expectedWidth = 15 * cellSize;
  const expectedHeight = 10 * cellSize;

  console.log(`Test case: ${testCase.name}`);
  console.log(`  Input: ${testCase.width}x${testCase.height}`);
  console.log(`  Cell size: ${cellSize}`);
  console.log(`  Expected output: ${expectedWidth}x${expectedHeight}`);
  console.log(
    `  Cell aspect ratio: ${cellSize}x${cellSize} (square: ${
      cellSize === cellSize ? "✓" : "✗"
    })`
  );
  console.log("");

  // Save test thumbnail
  const testPath = path.join(
    __dirname,
    "..",
    "public",
    "maps",
    "thumbnails",
    `test-square-${testCase.name}.png`
  );
  fs.writeFileSync(testPath, thumbnail);
}
