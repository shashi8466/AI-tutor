// Simple test to verify our components work
import React from 'react';
import { createRoot } from 'react-dom/client';
import DemoSystem from './src/components/DemoSystem';

// This is just to verify the component can be imported without errors
console.log('DemoSystem component imported successfully');

// Test the uploader component
import SimpleDocxUploader from './src/components/admin/SimpleDocxUploader';
console.log('SimpleDocxUploader component imported successfully');

// Test the viewer component
import SimpleQuizViewer from './src/components/student/SimpleQuizViewer';
console.log('SimpleQuizViewer component imported successfully');

console.log('All components imported successfully!');