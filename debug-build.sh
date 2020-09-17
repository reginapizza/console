#!/usr/bin/env bash

set -e

# Builds the server-side golang resources for tectonic-console. For a
# complete build, you must also run build-frontend

# Use deps from vendor dir.
export GOFLAGS="-mod=vendor"
GIT_TAG=${SOURCE_GIT_TAG:-$(git describe --always --tags HEAD)}
LD_FLAGS=" -X github.com/openshift/console/pkg/version.Version=${GIT_TAG}"
GC_FLAGS="'all=-N -l'"
go build -o ./bin/bridge -gcflags='all=-N -l' -ldflags "${LD_FLAGS}"  ./cmd/bridge