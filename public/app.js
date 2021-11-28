function getQueryStringObject() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}
var qs = getQueryStringObject();
var tmp_url = "ws://192.168.150.197:8070?network=" + qs.network + "&podName=" + qs.podName + "&containerName=" + qs.containerName

// console.log(url)
angular.module('k8sTerminal', ['kubernetesUI'])
    .config(function (kubernetesContainerSocketProvider) {
        kubernetesContainerSocketProvider.WebSocketFactory = "CustomWebSockets";
    })
    .run(function ($rootScope) {
        $rootScope.baseUrl = tmp_url;
        $rootScope.selfLink = "";
        $rootScope.preventSocket = true;
    })
    /* Our custom WebSocket factory adapts the url */
    .factory("CustomWebSockets", function ($rootScope) {
        return function CustomWebSocket(url, protocols) {
            url = $rootScope.baseUrl + url;
            console.log(url)
            return new WebSocket(tmp_url, 'echo-protocol');
        };
    });
