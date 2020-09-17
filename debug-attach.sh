#set up the debug environment and variables
source ./debug-environment.sh

consoleHost=$CONSOLE_HOST_NAME
consoleApiPort=$CONSOLE_API_PORT

dlv attach \
$(pgrep bridge | head -n 1) \
 --api-version=2 \
--listen=${consoleHost}:${debuggerApiPort} \
--log \
