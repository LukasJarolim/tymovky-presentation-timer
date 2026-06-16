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
var minutes int
var presentations []string
var presentation int = -1
var presentationStart time.Time = time.Time{}

const AUTOSTART bool = false

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
	minutes, err = strconv.Atoi(strings.TrimSuffix(string(minutesString), "\n"))
	if err != nil {
		fmt.Println("Cant get duration: " + err.Error())
		return
	}

	//Start server loop
	fmt.Println()
	server = httptools.NewWebSocketServer(
		"127.0.0.1:8080",
		func(conn *httptools.WebSocketServerConn, data []byte, status webtools.NetworkStatus, isBinary bool) {
			sendStatus(conn)
		},
		func(server *httptools.Server, w http.ResponseWriter, r *http.Request, params map[string]string) bool {
			return false
		},
		"./", false, true, true)
	go server.Start()
	time.Sleep(time.Second * 5)

	//Start input loop
	for server.IsAlive() {
		//Get command
		commandBytes, err := webtools.ReadLineFromConsole("Enter command [stop-sv/next(n)/refresh/start/stop/zero]: ")
		if err != nil {
			fmt.Println("Invalid command input: " + err.Error())
			break
		}
		command := strings.TrimSuffix(string(commandBytes), "\n")
		if command == "stop-sv" {
			//Stop clients
			server.BroadcastToClients(nil, []byte("stop|stop"))
			break
		} else if command == "next" || command == "n" {
			//Next client
			presentation++
			presentationStart = time.Now()
			for _, conn := range server.FilterClients(nil) {
				sendStatus(conn)
			}
		} else if command == "refresh" {
			//Refresh clients
			for _, conn := range server.FilterClients(nil) {
				sendStatus(conn)
			}
		} else if command == "start" {
			server.BroadcastToClients(nil, []byte("start|start"))
		} else if command == "stop" {
			server.BroadcastToClients(nil, []byte("stop|stop"))
		} else if command == "zero" {
			server.BroadcastToClients(nil, []byte("zero|zero"))
		}
	}
	server.Stop()
}

func sendStatus(conn *httptools.WebSocketServerConn) {
	//Send timeout
	conn.Send([]byte("timeout|" + strconv.Itoa(minutes*60*1000)))

	//Send presentation start
	if !presentationStart.IsZero() {
		conn.Send([]byte("current-start|" + presentationStart.Format(time.RFC3339)))
	}

	//Send current
	if len(presentations) > presentation && presentation >= 0 {
		conn.Send([]byte("current|" + presentations[presentation]))
		if AUTOSTART {
			conn.Send([]byte("start|start"))
		}
	} else {
		conn.Send([]byte("no_current|no_current"))
		conn.Send([]byte("stop|stop"))
		conn.Send([]byte("zero|zero"))
	}

	//Send next
	if len(presentations) > presentation+1 {
		conn.Send([]byte("next|" + presentations[presentation+1]))
	} else {
		conn.Send([]byte("no_next|no_next"))
	}
}
