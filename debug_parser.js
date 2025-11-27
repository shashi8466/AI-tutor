// Simple test to debug answer parsing
const testLine = "Answer: Au";
console.log("Testing line:", testLine);

// Current problematic regex
const badMatch = testLine.match(/Answer:\s*([A-D0-9]|[^\n]+)/i);
console.log("Bad regex result:", badMatch);

// Fixed regex - capture everything after "Answer:"
const goodMatch = testLine.match(/Answer:\s*(.+)/i);
console.log("Good regex result:", goodMatch);

if (goodMatch) {
  console.log("Answer text:", goodMatch[1]);
} else {
  console.log("No match found");
}