repo="https://raw.githubusercontent.com/mitchharpur/openshift-console-debugging/master/"

function downloadVSCodeFile(){
  local file=.vscode/$1
  if [ -f $file  ]
  then
    #make a copy of the old file
    mv $file .vscode/$(basename $(mktemp -u -t $1))
  fi
  local url="$repo$file"
  #download the new file
  curl -fSL $url -o $file
}

for shellScript in debug-{attach,build,connect,environment,get-ca-certificate,get-oauth-secret,launch,run,install-plugins}.sh
do
    if [ -f ./$shellScript ]
    then
      rm ./$shellScript
    fi
    url="$repo$shellScript"
    curl -LJO $url
    chmod u+x $shellScript
done
# create the folder if it does not exist
[[ -d ./.vscode ]] || mkdir ./.vscode
for file in {launch,tasks}.json
do
 downloadVSCodeFile $file
done
unset file