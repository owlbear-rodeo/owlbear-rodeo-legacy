## Connection

### Connection failure.

If you are getting a Connection failed error when trying to connect to a game try these following things.

- Ensure your internet connection is working.
- If you are using an incognito or private browsing tab try using normal browsing.
- If both computers are on the same network try connecting them to separate networks. For more info see below.

Owlbear Rodeo uses peer to peer connections to send data between the players. Specifically the [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) is used. WebRTC allows the sending of two types of data, the first is media such as a camera or microphone and the second is raw data such as chat messages or in this case the state of the game map.

As at this time we don't support voice or video chat as such we only use the raw data feature of WebRTC. This however can lead to connection issues, specifically with the Safari web browser and connecting between two devices on the same network. This is due a decision made by the Safari team to only allow fully peer to peer connections when the user grants camera permission to the website. Unfortunately that means in order to fully support Safari we would need to ask for camera permission even though we wouldn't be using it. To us that is a bad user experience so we have decided against it at this time.

The good news is that Safari will still work if the two devices are connected to a separate network as we make use of [TURN](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT) servers which will handle the IP sharing and are not blocked by Safari. So if you're seeing errors and are on the same network as the other person if possible switch to separate networks and try again. For more information about Safari's restrictions on WebRTC see this [bug report](https://bugs.webkit.org/show_bug.cgi?id=173052) on the Webkit site or this [blog post](https://webkit.org/blog/7763/a-closer-look-into-webrtc/).

### WebRTC not supported.

Owlbear Rodeo uses WebRTC to communicate between players. Ensure your browser supports WebRTC. A list of supported browsers can be found [here](https://caniuse.com/#feat=rtcpeerconnection).

### Unable to connect to party.

This can happen when your internet connection is stable but a peer to peer connection wasn't able to be established between party members. Refreshing the page can help in fixing this.
