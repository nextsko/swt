package main

import (
	"changeme/backend"
	"changeme/backend/repository"
	"changeme/backend/services"
	"embed"
	_ "embed"
	"log"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

var quitSignal = make(chan bool)

func init() {
	application.RegisterEvent[string]("time")
	application.RegisterEvent[services.ChatChunkEvent]("chat:chunk")
	application.RegisterEvent[services.MessageStatusEvent]("chat:status")
}

func main() {
	// 初始化数据层（Mock 实现）
	store := repository.NewMockStore()

	agentSvc := services.NewAgentService(store, store)
	botSvc := services.NewBotService(store, store, store)
	botSvc.SetPoolInvalidator(agentSvc)

	app := application.New(application.Options{
		Name:        "swt",
		Description: "A swt application",
		Services: []application.Service{
			application.NewService(backend.NewGreetService()),
			application.NewService(services.NewChatService(store)),
			application.NewService(services.NewContactService(store)),
			application.NewService(services.NewDiscoverService(store)),
			application.NewService(services.NewProfileService(store)),
			application.NewService(agentSvc),
			application.NewService(botSvc),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		PanicHandler: func(p *application.PanicDetails) {
			log.Printf("PANIC: %v\n%s\nFullStack:\n%s",
				p.Error, p.StackTrace, p.FullStackTrace)
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "swt",
		Width:            1024,
		Height:           768,
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	// Time events goroutine
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Listen for quit signal from frontend
	go func() {
		<-quitSignal
		app.Quit()
	}()

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
