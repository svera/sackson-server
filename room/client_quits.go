package room

import (
	"github.com/svera/sackson-server/events"
	"github.com/svera/sackson-server/interfaces"
)

func (r *Room) clientQuits(cl interfaces.Client) error {
	r.RemoveClient(cl)
	r.observer.Trigger(events.ClientOut{Client: cl, Reason: interfaces.ReasonPlayerQuitted, Room: r})
	return nil
}
