// Test script to verify complex formatting handling
const fs = require('fs');
const path = require('path');

// Create a test HTML file with complex formatting
const testHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Complex Formatting</title>
</head>
<body>
    <h1>Complex Formatting Test</h1>
    
    <h2>Question with Table</h2>
    <p>Q.1) What is the result of the following matrix operation?</p>
    
    <table>
        <tr>
            <th>Operation</th>
            <th>Result</th>
        </tr>
        <tr>
            <td>A + B</td>
            <td>[[2, 4], [6, 8]]</td>
        </tr>
        <tr>
            <td>A × B</td>
            <td>[[7, 10], [15, 22]]</td>
        </tr>
    </table>
    
    <p>A) Result is [[2, 4], [6, 8]]</p>
    <p>B) Result is [[7, 10], [15, 22]] <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="matrix diagram" /></p>
    <p>C) Result is undefined</p>
    <p>D) None of the above</p>
    
    <p>Answer: B</p>
    <p>Explanation: Matrix multiplication follows specific rules where each element is computed as the dot product of corresponding row and column.</p>
    
    <h2>Question with Mathematical Expressions</h2>
    <p>Q.2) Solve the quadratic equation: $ax^2 + bx + c = 0$ where a=1, b=-5, c=6</p>
    
    <p>A) $x = \\frac{5 \\pm \\sqrt{25-24}}{2}$</p>
    <p>B) $x = \\frac{-5 \\pm \\sqrt{25-24}}{2}$</p>
    <p>C) $x = \\frac{5 \\pm \\sqrt{1}}{2}$</p>
    <p>D) Both A and C</p>
    
    <p>Answer: D</p>
    <p>Explanation: Using the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ with the given values.</p>
    
    <h2>Short Answer Question</h2>
    <p>Q.3) What is the derivative of $f(x) = x^2$?</p>
    <p>Answer: 2x</p>
    <p>Explanation: Using the power rule $\\frac{d}{dx} x^n = nx^{n-1}$.</p>
</body>
</html>
`;

// Write the test HTML file
const testHtmlPath = path.join(__dirname, 'test_complex_formatting.html');
fs.writeFileSync(testHtmlPath, testHtmlContent);

console.log('Test HTML file created at:', testHtmlPath);
console.log('You can now test the quiz parser with this file to verify complex formatting handling.');