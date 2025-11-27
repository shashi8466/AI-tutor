// Debug question text extraction
const testLine = "Q. 1) What is the capital of France?";

console.log("Testing question text extraction:");
console.log(`Line: "${testLine}"`);

// Test header match
const headerMatch = testLine.match(/^Q\.\s*\d+\)\s*(.*)/i);
console.log(`Header match:`, headerMatch);

if (headerMatch && headerMatch[1]) {
  console.log(`Extracted text: "${headerMatch[1].trim()}"`);
} else {
  // Test header only match
  const headerOnly = testLine.match(/^Q\.\s*\d+\)/i);
  console.log(`Header only match:`, headerOnly);
  
  if (headerOnly) {
    const remainingText = testLine.replace(headerOnly[0], '').trim();
    console.log(`Remaining text: "${remainingText}"`);
  }
}