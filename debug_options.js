// Debug option detection
const testLines = [
  "A. Paris",
  "B. London", 
  "C. Berlin",
  "D. Madrid"
];

console.log("Testing option detection:");

testLines.forEach((line, index) => {
  console.log(`\nLine ${index + 1}: "${line}"`);
  
  // Current regex pattern
  const optionMatch = line.match(/^([A-D])[\.\)\-]?\s*(.+)$/i);
  if (optionMatch) {
    console.log(`  Match found:`);
    console.log(`    Full match: "${optionMatch[0]}"`);
    console.log(`    Letter: "${optionMatch[1]}"`);
    console.log(`    Content: "${optionMatch[2]}"`);
  } else {
    console.log(`  No match found`);
  }
});

// Test with answer line
const answerLine = "Answer: A";
console.log(`\nAnswer line: "${answerLine}"`);
const answerMatch = answerLine.match(/Answer:\s*(.+)/i);
if (answerMatch) {
  console.log(`  Answer match: "${answerMatch[1]}"`);
}