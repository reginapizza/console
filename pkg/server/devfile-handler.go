package server

import (
	"crypto/tls"
	"net/http"
	"net/url"

	"github.com/coreos/dex/api"
	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/proxy"
)

type jsGlobals struct {
	ConsoleVersion           string `json:"consoleVersion"`
	AuthDisabled             bool   `json:"authDisabled"`
	KubectlClientID          string `json:"kubectlClientID"`
	BasePath                 string `json:"basePath"`
	LoginURL                 string `json:"loginURL"`
	LoginSuccessURL          string `json:"loginSuccessURL"`
	LoginErrorURL            string `json:"loginErrorURL"`
	LogoutURL                string `json:"logoutURL"`
	LogoutRedirect           string `json:"logoutRedirect"`
	RequestTokenURL          string `json:"requestTokenURL"`
	KubeAdminLogoutURL       string `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL         string `json:"kubeAPIServerURL"`
	PrometheusBaseURL        string `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL string `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL      string `json:"alertManagerBaseURL"`
	MeteringBaseURL          string `json:"meteringBaseURL"`
	Branding                 string `json:"branding"`
	CustomProductName        string `json:"customProductName"`
	CustomLogoURL            string `json:"customLogoURL"`
	StatuspageID             string `json:"statuspageID"`
	DocumentationBaseURL     string `json:"documentationBaseURL"`
	AlertManagerPublicURL    string `json:"alertManagerPublicURL"`
	GrafanaPublicURL         string `json:"grafanaPublicURL"`
	PrometheusPublicURL      string `json:"prometheusPublicURL"`
	ThanosPublicURL          string `json:"thanosPublicURL"`
	LoadTestFactor           int    `json:"loadTestFactor"`
	InactivityTimeout        int    `json:"inactivityTimeout"`
	GOARCH                   string `json:"GOARCH"`
	GOOS                     string `json:"GOOS"`
	GraphQLBaseURL           string `json:"graphqlBaseURL"`
}

type Server struct {
	K8sProxyConfig       *proxy.Config
	BaseURL              *url.URL
	LogoutRedirect       *url.URL
	PublicDir            string
	TectonicVersion      string
	Auther               *auth.Authenticator
	StaticUser           *auth.User
	KubectlClientID      string
	KubeAPIServerURL     string
	DocumentationBaseURL *url.URL
	Branding             string
	CustomProductName    string
	CustomLogoFile       string
	StatuspageID         string
	LoadTestFactor       int
	DexClient            api.DexClient
	InactivityTimeout    int
	// A client with the correct TLS setup for communicating with the API server.
	K8sClient                        *http.Client
	ThanosProxyConfig                *proxy.Config
	ThanosTenancyProxyConfig         *proxy.Config
	ThanosTenancyProxyForRulesConfig *proxy.Config
	AlertManagerProxyConfig          *proxy.Config
	MeteringProxyConfig              *proxy.Config
	TerminalProxyTLSConfig           *tls.Config
	GitOpsProxyConfig                *proxy.Config
	HelmChartRepoProxyConfig         *proxy.Config
	HelmDefaultRepoCACert            []byte
	GOARCH                           string
	GOOS                             string
	// Monitoring and Logging related URLs
	AlertManagerPublicURL *url.URL
	GrafanaPublicURL      *url.URL
	PrometheusPublicURL   *url.URL
	ThanosPublicURL       *url.URL
}

func (s *Server) devfileHandler(user *auth.User, w http.ResponseWriter, r *http.Request) {

}
