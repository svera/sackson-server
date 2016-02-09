$(function() {
    if (!window["WebSocket"]) {
        return;
    }

    var playerControls = $("#player-controls");
    var url = [location.host, location.pathname].join('');
    var conn = new WebSocket('ws://' + url + '/join');
    var playerActive = true;

    conn.onclose = function(e) {
        $("#playButton").attr("disabled", true);
    };

    // Whenever we receive a message, update
    conn.onmessage = function(e) {
        msg = JSON.parse(e.data);
        switch (msg.typ) {
            case "err":
                console.log(msg.cnt);
                break;
            case "upd":
                //console.log(msg);
                updateBoard(msg.brd);
                if (msg.ebl) {
                    playerActive = true;
                    if (msg.hasOwnProperty("sta")) {
                        if (msg.sta == "PlayTile") {
                            updateHand(msg.hnd);
                        }
                        if (msg.sta == "FoundCorp") {
                            chooseNewCorporation(msg.ina);
                        }
                        if (msg.sta == "BuyStock") {
                            buyStocks(msg.act);
                        }
                        if (msg.sta == "SellTrade") {
                            sellTrade(msg.sha);
                        }
                        if (msg.sta == "UntieMerge") {
                            untieMerge(msg.tie);
                        }
                    }
                } else {
                    playerActive = false;
                    $("#player-controls").html("")
                }
                break;
        }
    };

    playerControls.on("click", '#playButton', function() {
        tl = $('input[name=tiles]:checked')
        conn.send(
            createPlayTileMessage(tl.val())
        );
    });

    createPlayTileMessage = function(tl) {
        var message =  {
            "typ": "ply",
            "par": {
                "til": tl
            }
        };
        return JSON.stringify(message);
    }

    playerControls.on("click", '#newCorpButton', function() {
        corps = $('input[name=corps]:checked')
        conn.send(
            createNewCorpMessage(corps.val())
        );
    });

    createNewCorpMessage = function(corp) {
        var message =  {
            "typ": "ncp",
            "par": {
                "cor": corp
            }
        };
        return JSON.stringify(message);
    }

    playerControls.on("click", '#buyButton', function() {
        var buy = {};
        $('.buyStocks').each(function() {
            buy[this.name] = $(this).val();
        })
        conn.send(
            createNewBuyMessage(buy)
        );        
    });

    createNewBuyMessage = function(buy) {
        var message =  {
            "typ": "buy",
            "par": {
                "cor": {}
            }
        };
        for (corp in buy) {
            message["par"]["cor"][corp] = parseInt(buy[corp]);
        }
        console.log(JSON.stringify(message));
        return JSON.stringify(message);
    }

    playerControls.on("click", '#sellTradeButton', function() {
        var corps = {};
        $('.sell').each(function() {
            corps[this.name] = {}
            corps[this.name]["sel"] = parseInt($(this).val());
        })
        $('.trade').each(function() {
            corps[this.name]["tra"] = parseInt($(this).val());
        })            
        conn.send(
            createSellTradeMessage(corps)
        );
    });

    createSellTradeMessage = function(corps) {
        var message =  {
            "typ": "sel",
            "par": {
                "cor": corps
            }
        };
        console.log(JSON.stringify(message));
        return JSON.stringify(message);
    }

    playerControls.on("click", '#untieMergeButton', function() {
        corps = $('input[name=corps]:checked')
        conn.send(
            createUntieMergeMessage(corps.val())
        );
    });

    createUntieMergeMessage = function(corp) {
        var message =  {
            "typ": "unt",
            "par": {
                "cor": corp
            }
        };
        return JSON.stringify(message);
    }

    playerControls.on("click", '#claimEndButton', function() {
        conn.send(
            createClaimEndMessage()
        );
    });

    createClaimEndMessage = function() {
        var message =  {
            "typ": "end",
            "par": {}
        };
        return JSON.stringify(message);
    }

////////////////////
// HTML functions //
///////////////////

    updateBoard = function(tiles) {
        Object.keys(tiles).forEach(function(key) {
            $('#'+key).removeClass();
            if (tiles[key] == 'unincorporated') {
                $('#'+key).addClass('unincorporated')
            } else {
                $('#'+key).addClass(tiles[key])
            }
        });
    }

    updateHand = function(hand) {
        $("#player-controls").html("");
        var html = '<div class="btn-group" role="group" aria-label="..." data-toggle="buttons">';

        for (var i = 0; i < hand.length; i++) {
            html += '<label class="btn btn-default">'+
                        '<input type="radio" name="tiles" value="'+ hand[i] +'">'+
                        '<span>' + hand[i] +'</span>'+
                    '</label>';
        }
        buttonState = !playerActive ? 'disabled="true"' : '';
        html += '</div>'+
                      '<input type="button" id="playButton" class="btn btn-primary" value="Play tile"' + buttonState +' />'+
                      '<input type="button" id="claimEndButton" class="btn" value="Claim game end"' + buttonState +' />';
        $("#player-controls").append(html);
    }

    chooseNewCorporation = function(corporations) {
        $("#player-controls").html("");
        var html = '<div class="btn-group" role="group" aria-label="..." data-toggle="buttons">'+
                        '<p>You have founded a new corporation! Please choose one:</p>';

        for (var i = 0; i < corporations.length; i++) {
            html += '<label class="btn btn-default">'+
                        '<input type="radio" name="corps" value="'+ corporations[i].toLowerCase() +'">'+
                        '<span>' + corporations[i] +'</span>'+
                    '</label>';
        }
        buttonState = !playerActive ? 'disabled="true"' : '';
        html += '</div>'+
                      '<input type="button" id="newCorpButton" class="btn btn-primary" value="Found corporation"' + buttonState +' />'+
                      '<input type="button" id="claimEndButton" class="btn" value="Claim game end"' + buttonState +' />';
        $("#player-controls").append(html);
    }

    buyStocks = function(corporations) {
        $("#player-controls").html("");
        var html = '<p>Buy Stocks</p>'+
                    '<ul class="list-unstyled">';
        for (var i = 0; i < corporations.length; i++) {
            html += '<li><label>'+
                        '<span>' + corporations[i] +'</span>'+
                        '<input type="number" min="0" max="3" name="'+ corporations[i].toLowerCase() +'" value="0" class="buyStocks">'+
                    '</label></li>';
        }
        buttonState = !playerActive ? 'disabled="true"' : '';
        html += '</ul>' +
               '<input type="button" id="buyButton" class="btn btn-primary" value="Buy"' + buttonState +' />'+
               '<input type="button" id="claimEndButton" class="btn" value="Claim game end"' + buttonState +' />';
        $("#player-controls").append(html);
    }

    sellTrade = function(corporations) {
        $("#player-controls").html("");
        var html =  '<p>Sell / Trade stock shares</p>'+
                        '<table>'+
                            '<thead><tr>'+
                                '<th>&nbsp;</th><th>Sell</th><th>Trade</th>'+
                            '</tr></thead>'+
                            '<tbody>';
        for (var name in corporations) {
            html += '<tr><td>' + name + '</td>'+
                        '<td><input type="number" min="0" max="'+ corporations[name]+'" name="'+ name +'" value="0" class="sell"></td>'+
                        '<td><input type="number" min="0" max="'+ corporations[name]+'" name="'+ name +'" value="0" step="2" class="trade"></td>'+
                    '</tr>';
        }      
        buttonState = !playerActive ? 'disabled="true"' : '';                      
        html += '</tbody></table>'+
            '<input type="button" id="sellTradeButton" class="btn btn-primary" value="Sell / Trade"' + buttonState +' />'+
            '<input type="button" id="claimEndButton" class="btn" value="Claim game end"' + buttonState +' />';
        $("#player-controls").append(html);
    }

    untieMerge = function(corporations) {
        $("#player-controls").html("");
        var html = '<div class="btn-group" role="group" aria-label="..." data-toggle="buttons">'+
                        '<p>There is a tie in the merge:</p>';

        for (var i = 0; i < corporations.length; i++) {
            html += '<label class="btn btn-default">'+
                        '<input type="radio" name="corps" value="'+ corporations[i].toLowerCase() +'">'+
                        '<span>' + corporations[i] +'</span>'+
                    '</label>';
        }
        buttonState = !playerActive ? 'disabled="true"' : '';
        html += '</div>'+
          '<input type="button" id="untieMergeButton" class="btn btn-primary" value="choose acquiring corporation"' + buttonState +' />'+
          '<input type="button" id="claimEndButton" class="btn" value="Claim game end"' + buttonState +' />';
        $("#player-controls").append(html);
    }    
});