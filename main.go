package main

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"webtools"
	"webtools/httptools"
)

var server *httptools.WebSocketServer
var timeout int
var presentations []string
var presentation int = -1
var autostart bool = false
var currentTime = 0
var ticker *time.Ticker
var running = false
var done = make(chan bool)

func main() {
	//Get TXT path
	path, err := webtools.ReadLineFromConsole("Enter path to TXT: ")
	if err != nil {
		fmt.Println("Cant load TXT: " + err.Error())
		return
	}

	//Open file
	file, err := os.Open(strings.TrimSuffix(string(path), "\n"))
	if err != nil {
		fmt.Println("Cant load TXT: " + err.Error())
		return
	}
	defer file.Close()

	//Scan the file
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		presentations = append(presentations, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("Cant load TXT: " + err.Error())
		return
	}

	//Get durations
	minutesString, err := webtools.ReadLineFromConsole("Enter time per presentation [minutes]: ")
	if err != nil {
		fmt.Println("Cant get duration: " + err.Error())
		return
	}

	//Get time
	timeout, err = strconv.Atoi(strings.TrimSuffix(string(minutesString), "\n"))
	if err != nil {
		fmt.Println("Cant get duration: " + err.Error())
		return
	}

	//Start server loop
	fmt.Println()
	server = httptools.NewWebSocketServer(
		"127.0.0.1:8080",
		func(conn *httptools.WebSocketServerConn, data []byte, status webtools.NetworkStatus, isBinary bool) {
			sendStatus(false)
		},
		func(server *httptools.Server, w http.ResponseWriter, r *http.Request, params map[string]string) bool {
			return false
		},
		"./", false, false, false)
	go server.Start()
	time.Sleep(time.Second * 5)

	//Start input loop
	for server.IsAlive() {
		//Get command
		commandBytes, err := webtools.ReadLineFromConsole("Enter command [stop-sv/back(b)/next(n)/update(u)/start(s)/pause(p)/reset(r)/autostart(a)]: ")
		if err != nil {
			fmt.Println("Invalid command input: " + err.Error())
			break
		}
		command := strings.TrimSuffix(string(commandBytes), "\n")
		if command == "stop-sv" {
			break
		} else if command == "back" || command == "b" {
			//Prev client
			presentation--
			if presentation < -1 {
				presentation = -1
			}
			reset(true)
			if autostart {
				start()
			}
			sendStatus(false)
			continue
		} else if command == "next" || command == "n" {
			//Next client
			presentation++
			reset(true)
			if autostart {
				start()
			}
			sendStatus(false)
			continue
		} else if command == "update" || command == "u" {
			//Refresh clients
			sendStatus(false)
			continue
		} else if command == "start" || command == "s" {
			start()
			continue
		} else if command == "reset" || command == "r" {
			wasRunning := running
			reset(true)
			if wasRunning {
				start()
			}
			continue
		} else if command == "pause" || command == "p" {
			if ticker != nil {
				ticker.Stop()
			}
			running = false
			sendStatus(false)
			continue
		} else if command == "autostart" || command == "a" {
			autostart = !autostart
			fmt.Println("Autostart is now: " + webtools.FormatByBool(autostart, "ENABLED", "DISABLED") + ".")
			continue
		}
	}
	server.Stop()
}

func start() {
	ticker = time.NewTicker(time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				{
					currentTime++
					sendStatus(true)
				}
			case <-done:
				{
					return
				}
			}
		}
	}()
	running = true
	sendStatus(false)
}

func reset(report bool) {
	if ticker != nil {
		ticker.Stop()
	}
	currentTime = 0
	if running {
		done <- true
	}
	running = false
	if report {
		sendStatus(false)
	}
}
func sendStatus(timeOnly bool) {
	//Send current
	if !timeOnly {
		if len(presentations) > presentation && presentation >= 0 {
			server.BroadcastToClients(nil, []byte("current|"+presentations[presentation]))
		} else {
			server.BroadcastToClients(nil, []byte("no_current|no_current"))
			reset(false)
		}
	}

	//Send next
	if !timeOnly {
		if len(presentations) > presentation+1 {
			server.BroadcastToClients(nil, []byte("next|"+presentations[presentation+1]))
		} else {
			server.BroadcastToClients(nil, []byte("no_next|no_next"))
		}
	}

	//Calculate time
	var remainingTime = (timeout*60 - currentTime)
	var negate = false
	if remainingTime < 0 {
		negate = true
		remainingTime = -remainingTime
	}
	var minutes = remainingTime / 60
	var seconds = remainingTime - minutes*60
	var result = ""
	if negate {
		result += "-"
	}
	result += fmt.Sprintf("%02d", minutes)
	result += ":"
	result += fmt.Sprintf("%02d", seconds)
	server.BroadcastToClients(nil, []byte("time|"+result))
	server.BroadcastToClients(nil, []byte("timeRed|"+webtools.FormatByBool(negate, "true", "false")))
}
