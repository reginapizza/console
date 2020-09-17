package server

import (
	"encoding/json"
	"net/http"
)

type Data struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	// Project Project `json:"project`
	// Application Application `json:"application"`

}

func (s *Server) devfileHandler(w http.ResponseWriter, r *http.Request) {
	var data Data
	_ = json.NewDecoder(r.Body).Decode(&data)
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("reached devfile handler"))
}
