package backend

import "github.com/wailsapp/wails/v3/pkg/application"

type GreetService struct{}

func NewGreetService() *GreetService {
	return &GreetService{}
}

func (g *GreetService) Greet(name string) string {
	return "Hello " + name + "!"
}

func (g *GreetService) QuitApp() {
	app := application.Get()
	if app != nil {
		app.Quit()
	}
}
