#!/bin/bash
cd /home/kavia/workspace/code-generation/executive-portfolio-summaries-29655-26597/executive_portfolio_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

