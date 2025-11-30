#!/bin/bash

# Script to create GitHub repository and push code
# Usage: ./setup-github.sh <repository-name> [github-username]

REPO_NAME="${1:-cryptoinsight-pro}"
GITHUB_USER="${2:-}"

if [ -z "$GITHUB_USER" ]; then
    echo "Please provide your GitHub username:"
    read GITHUB_USER
fi

echo "Creating GitHub repository: $GITHUB_USER/$REPO_NAME"

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
    echo "GitHub CLI not found. Please create the repository manually:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository named: $REPO_NAME"
    echo "3. Do NOT initialize with README, .gitignore, or license"
    echo ""
    echo "Then run these commands:"
    echo "  git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
fi

