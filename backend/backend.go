package backend

var quitSignal = make(chan bool)

type GreetService struct{}

func NewGreetService() *GreetService {
	return &GreetService{}
}

func (g *GreetService) Greet(name string) string {
	return "Hello " + name + "!"
}

func (g *GreetService) QuitApp() {
	quitSignal <- true
}
