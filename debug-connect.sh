#!/usr/bin/env bash

#set -e

#set up the debug environment and variables
source ./debug-environment.sh

consoleHost=$CONSOLE_HOST_NAME
consoleApiPort=$CONSOLE_API_PORT
debuggerApiPort=$CONSOLE_DEBUGGER_API_PORT
consoleClusterUrl=$CONSOLE_CLUSTER_URL
consoleAlertManagerUrl=$CONSOLE_ALERTMANAGER_URL
consoleThanosUrlk=$CONSOLE_THANOS_URL


dlv connect ${consoleHost}:${debuggerApiPort}