var express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res, next) { res.render('chat.html'); });
app.get('/chat/', function(req, res, next) { res.render('chat.html'); });

app.use(express.static('static'));

var server = app.listen(9000);

var options = {
    debug: true
}

var ExpressPeerServer = require('peer').ExpressPeerServer;
var peerServer = ExpressPeerServer(server, options);
app.use('/peerjs', peerServer);

peerServer.on('connection', function(id) {
        console.log('peerServer.on(\'connection\'): ' + id);
        sendPeerListToClients();
    });

peerServer.on('disconnect', function(id) {
        console.log('peerServer.on(\'disconnect\'): ' + id);
        sendPeerListToClients();
    });

function sendPeerListToClients() {
    var peers = peerServer._clients.peerjs;
    var str = "PEER_LIST";
    for (peer in peers)
        str += " " + peer;
    for (peer in peers)
        peers[peer].socket.send(str);
}
