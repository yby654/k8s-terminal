let baseurl = window.location.href
if (global === undefined) {
    var global = window;
}
global.baseUrl = baseurl
console.log(global.baseUrl)

angular.module('k8sTerminal', ['kubernetesUI'])
    .config(function (kubernetesContainerSocketProvider) {
        kubernetesContainerSocketProvider.WebSocketFactory = "CustomWebSockets";
    })
    .run(function ($rootScope) {
        $rootScope.baseUrl = "ws://192.168.150.197:8080";
        $rootScope.selfLink = "/";
        $rootScope.preventSocket = true;
    })
    /* Our custom WebSocket factory adapts the url */
    .factory("CustomWebSockets", function ($rootScope) {
        return function CustomWebSocket(url, protocols) {
            url = $rootScope.baseUrl + url;
            return new WebSocket('ws://192.168.150.197:8080', 'echo-protocol');
        };
    });

export const baseurl = baseurl