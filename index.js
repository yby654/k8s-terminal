process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
// defined k8x configuration

const querys = require('query-string');
const WebSocketServer = require('websocket').server;
const WebSocket = require('ws');
const express = require('express');

const fs = require('fs');
const path = require('path');
const http = require('http');
const documentRoot = 'public';

var app = express();
var server = require('http').Server(app);

app.use(express.static('public'));

server.listen(8070, function () {
    console.log((new Date()) + ' Server is listening on port 8070');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}
var connection;
wsServer.on('request', function (request, response) {
    console.log(request)
    console.log(request.resourceURL.query.network)
    const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ilg1Rk0yNlJYT1FmUUEwR1F1V1p3cXB0UEgyRUZXNmJ5WllONFZSUjAyZ1kifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJjbHVzdGVyLTEtdG9rZW4tOGtnajIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiY2x1c3Rlci0xIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiZTYxZTdkOWEtNmI3MC00MTk3LTlkNjEtZDI3YTNjYTU5MDczIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmUtc3lzdGVtOmNsdXN0ZXItMSJ9.TQ-dsLcP5Q3s64s34Pc7tJS1AxWBKmY4Z2vrxTa9_qxr5plYVGVUZplZ4Ga5YbJZcymi6GKNVHR2f6XgkjiJDrVPQgbfb0Q74hxzsxtvSbUolj_n_QmvxxXtDUgvVZI_L0sK4YDzVLFrxXqa9czw9mZnGC7BpfUbYAwI0uXgjZixCKUdGIMGPHeSWgrHn-y-pNcRuHu19E0QkMBLayRoQmYO70ks3LFfDnb4PWqsC4Doe5IOvYRpzjMTOBMUH_cT_-TlwMUPXBMb_VTxwfVZJ32xfXEDuhqa7upx-c9YUhFKJUuen2EbzHo4zm46Pj-cu7ScqmwnsdZBL2J4ClgxFQ";
    const host = 'https://192.168.150.194:6443';
    const namespace = request.resourceURL.query.network
    const pod = request.resourceURL.query.podName
    const container = request.resourceURL.query.containerName
    const command = 'sh';
    const url = `${host}/api/v1/namespaces/${namespace}/pods/${pod}/exec?container=${container}&stdin=true&stdout=true&stderr=true&tty=true&command=${command}&pretty=true&follow=true`;
    console.log(url)
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    const ws = new WebSocket(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    ws.on('open', () => {

        console.log('connected to K8S container');
    });

    // 轉發 k8s exec 收到的資料到 client
    ws.on('message', (data) => {
        var type = data.slice(0, 1).toString('hex')[1];
        var string = data.toString('utf8');
        var paddingMessage = type + data.slice(1).toString('base64');
        console.log('Reply: ' + paddingMessage);
        connection.send(paddingMessage);
    });

    // 處理由 web socket client 收到的訊息轉發 k8s exec api
    connection.on('message', function (message) {
        if (ws && ws.readyState === 1 && message.utf8Data[0] === '0') {
            if (message.type === 'utf8') {
                console.log('Received Message: ' + message.utf8Data);

                // stdin must add 0 padding at first
                var buffer = Buffer.from(message.utf8Data.slice(1), 'base64');
                if (buffer.length > 0) {
                    var panddingBuffer = Buffer.concat([Buffer.from('00', 'hex'), buffer]);
                    ws.send(panddingBuffer);
                }
            } else if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');

                // TODO padding??
                ws.send(message.binaryData);
            }
        }
    });

});

