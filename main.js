#!/usr/bin/env node
// Main application entry point for the React Ink TUI
require('@babel/register')({
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    require.resolve('@babel/preset-react')
  ],
  ignore: [/node_modules/],
  extensions: ['.jsx', '.js']
});

// Load the UI
require('./src/ui/index.jsx');
