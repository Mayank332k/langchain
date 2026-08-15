const React = require('react');
const { render } = require('ink');
const App = require('./App');

// Clear the terminal completely before starting the UI
console.clear();

// Render the Ink App
render(React.createElement(App));
