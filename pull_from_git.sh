#!/bin/bash
# Script to stash local changes, pull from origin/main, and reapply changes

echo "Stashing local changes..."
git stash push -m "Stashing before pull from origin/main"

echo "Pulling from origin/main..."
git pull origin main

echo "Reapplying stashed changes..."
git stash pop

echo "Done! If there are conflicts, resolve them manually."

