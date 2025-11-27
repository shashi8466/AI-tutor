const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the database
const dbPath = path.join(__dirname, 'server', 'data.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Check table structure
db.all("PRAGMA table_info(quiz_questions);", (err, rows) => {
  if (err) {
    console.error('Error querying table info:', err.message);
    return;
  }
  console.log('Table structure:');
  console.log(rows);
});

// Check a few sample questions
db.all("SELECT id, question_number, question_text, options_json, question_type FROM quiz_questions LIMIT 3;", (err, rows) => {
  if (err) {
    console.error('Error querying sample questions:', err.message);
    return;
  }
  console.log('Sample questions:');
  rows.forEach(row => {
    console.log(`ID: ${row.id}, Q#: ${row.question_number}`);
    console.log(`Question: ${row.question_text}`);
    console.log(`Options JSON: ${row.options_json}`);
    console.log(`Question Type: ${row.question_type}`);
    try {
      const options = JSON.parse(row.options_json);
      console.log(`Parsed Options:`, options);
    } catch (e) {
      console.log(`Error parsing options:`, e.message);
    }
    console.log('---');
  });
});

// Close the database
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});