#!/bin/bash
# Cleanup script for stuck esbuild/vite processes in this project

PROJECT_DIR="/Users/kylefang/Projects/alx/Tessera"

# Find and kill esbuild processes for this project
pkill -f "$PROJECT_DIR/node_modules.*esbuild.*--service"

# Find and kill vite processes for this project
pkill -f "$PROJECT_DIR/node_modules.*vite"

echo "Cleaned up stuck processes. You can now run 'bun run dev'"
