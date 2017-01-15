var express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res, next) { res.render('wx.html'); });
app.get('/wx/', function(req, res, next) { res.render('wx.html'); });

app.use(express.static('static'));

var server = app.listen(9000);

var options = {
    debug: true
}

var ExpressPeerServer = require('peer').ExpressPeerServer;
var peerServer = ExpressPeerServer(server, options);
app.use('/peerjs', peerServer);

var nickTable = Object();

peerServer.on('connection', function(id) {
        console.log('peerServer.on(\'connection\'): ' + id);
        sendPeerListToClients();
    });

peerServer.on('disconnect', function(id) {
        console.log('peerServer.on(\'disconnect\'): ' + id);
        delete nickTable[id];
        sendPeerListToClients();
    });

peerServer.on('userdefined', function(id, payload) {
        if (payload.type == 'NICKNAME') {
            var nickname = payload.payload;
            if (!nickname)
                nickname = null;
            else
                nickname = nickname.toString();
            console.log('NICKNAME ' + id + ' ' + nickname);
            nickTable[id] = nickname;
            sendPeerListToClients();
        }
    });

function sendPeerListToClients() {
    var peers = peerServer._clients.peerjs;
    var ids = Array();
    for (peer in peers)
        ids.push([peer, nickTable[peer]]);
    for (peer in peers)
        if (peers[peer].socket && (peers[peer].socket.readyState == peers[peer].socket.OPEN))
            peers[peer].socket.send(JSON.stringify({type: 'PEER-LIST', payload: {peers: ids}}));
}
