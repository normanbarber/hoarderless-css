#!/bin/bash

BASE_DIR=`dirname $0`

echo ""
echo "Running all tests..."
echo "-------------------------------------------------------------------"

echo "Running server tests..."
node $BASE_DIR/../node_modules/mocha/bin/mocha -R spec $BASE_DIR/../test/unit/server

echo "all test suites complete"
echo "-------------------------------------------------------------------"
