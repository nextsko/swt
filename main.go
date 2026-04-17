package main

import (
	"changeme/backend"
	"embed"
	_ "embed"
	"log"
	"runtime"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

//go:embed all:frontend/dist
var assets embed.FS

var quitSignal = make(chan bool)

func init() {
	application.RegisterEvent[string]("time")
}

func main() {
	app := application.New(application.Options{
		Name:        "swt",
		Description: "A swt application",
		Services: []application.Service{
			application.NewService(backend.NewGreetService()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Windows: application.WindowsOptions{
			// Prevent app from quitting when last window closes
			DisableQuitOnLastWindowClosed: true,
		},
	})

	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:       "My Product",
		Width:       500,
		Height:      800,
		Frameless:   true,
		AlwaysOnTop: true,
		Hidden:      true,
		Windows: application.WindowsWindow{
			HiddenOnTaskbar: true,
		},
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	// System Tray Setup
	systemTray := app.SystemTray.New()
	if runtime.GOOS == "darwin" {
		systemTray.SetTemplateIcon(icons.SystrayMacTemplate)
	} else {
		systemTray.SetDarkModeIcon(icons.SystrayDark)
		systemTray.SetIcon(icons.SystrayLight)
	}

	// System Tray Menu
	myMenu := app.Menu.New()
	myMenu.Add("Show Window").OnClick(func(_ *application.Context) {
		window.Show()
	})
	myMenu.Add("Hide Window").OnClick(func(_ *application.Context) {
		window.Hide()
	})
	myMenu.AddSeparator()
	myMenu.Add("Quit").OnClick(func(_ *application.Context) {
		app.Quit()
	})
	systemTray.SetMenu(myMenu)

	// Attach window to systray
	systemTray.AttachWindow(window).WindowOffset(5)

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
