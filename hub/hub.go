package hub

import (
	"encoding/json"
	"github.com/svera/acquire-server/client"
)

type Hub struct {
	// Registered clients
	clients []*client.Client

	// Inbound messages
	Messages chan *client.Message

	// Register requests
	Register chan *client.Client

	// Unregister requests
	Unregister chan *client.Client

	gameBridge Bridge
}

func New(b Bridge) *Hub {
	return &Hub{
		Messages:   make(chan *client.Message),
		Register:   make(chan *client.Client),
		Unregister: make(chan *client.Client),
		clients:    []*client.Client{},
		gameBridge: b,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.Register:
			h.clients = append(h.clients, c)
			if err := h.gameBridge.AddPlayer(); err != nil {
				break
			}
			if len(h.clients) == 1 {
				c.Owner = true
				msg := struct {
					Type string `json:"typ"`
					Role string `json:"rol"`
				}{
					Type: "ctl",
					Role: "mng",
				}
				response, _ := json.Marshal(msg)
				h.sendMessage(c, response)
			}
			msg := struct {
				Type   string   `json:"typ"`
				Values []string `json:"val"`
			}{
				Type:   "add",
				Values: h.clientNames(),
			}
			response, _ := json.Marshal(msg)
			for _, c := range h.clients {
				h.sendMessage(c, response)
			}
			break

		case c := <-h.Unregister:
			for _, val := range h.clients {
				if val == c {
					h.removeClient(c)
					close(c.Incoming)
				}
			}
			break

		case m := <-h.Messages:
			if m.Author != h.currentPlayerClient() {
				break
			}

			response, err := h.gameBridge.ParseMessage(m.Content.Type, m.Content.Params)

			if err != nil {
				h.sendMessage(m.Author, response)
			} else {
				h.broadcastUpdate()
			}
		}
	}
}

func (h *Hub) clientNames() []string {
	names := []string{}
	for _, c := range h.clients {
		names = append(names, c.Name)
	}
	return names
}

func (h *Hub) broadcastUpdate() {
	for n, c := range h.clients {
		response := h.gameBridge.Status(n)
		h.sendMessage(c, response)
	}
}

func (h *Hub) currentPlayerClient() *client.Client {
	return h.clients[h.gameBridge.CurrentPlayerNumber()]
}

func (h *Hub) sendMessage(c *client.Client, message []byte) {
	select {
	case c.Incoming <- message:
		break

	// We can't reach the client
	default:
		close(c.Incoming)
		h.removeClient(c)
	}
}

func (h *Hub) removeClient(c *client.Client) {
	for i := range h.clients {
		if h.clients[i] == c {
			h.clients = append(h.clients[:i], h.clients[i+1:]...)
			break
		}
	}
}
