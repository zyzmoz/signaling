angular.module('myApp')

.controller('msgCtrl', ['$scope', function($scope){
  $scope.messages = [];
  $scope.socket = null;
  $scope.myVideo = document.getElementById("myVideo");
  $scope.theirVideo = document.getElementById("theirVideo");

  var configuration = {
    iceServers: [{
      url: 'stun:stun.l.googlr.com:19302'
    }]
  };
  var rtcPeerConn;

  connect();

  function connect(){
    $scope.socket = io.connect();
    //setting parameters of rooms w/ signal
    $scope.socket.emit('ready', {chat_room: "room", signal_room: "signaling_room" });
    $scope.socket.emit('signal', {type: "user_here", message: "Are you ready", room: "signaling_room"});
    console.log('Connect');
  };

  $scope.socket.on('announce', function(data){
    console.log(data.message);
    $scope.messages.push({msg: data.message});
    $scope.$digest();
  });

  $scope.socket.on('signaling_message', function(data){
    console.log('signal OK');
    if (!rtcPeerConn)
      startSignaling();

    console.log(data);

    if (data.type != 'user_here'){
      var message = JSON.parse(data.message);
      console.log(message);
      if(message.sdp){
        rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp),
          function(){
            if (rtcPeerConn.remoteDescription.type == 'offer'){
              rtcPeerConn.createAnswer(sendLocalDesc, logError)
            }
          }, logError);
      } else {
        rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
      }

    };

    $scope.$digest();
  });

  function startSignaling(){
    rtcPeerConn = new webkitRTCPeerConnection(configuration);
    rtcPeerConn.onicecandidate = function(evt){
      console.log(evt);
      $scope.socket.emit('signal', {type: 'ice candidate', message: JSON.stringify({'candidate': evt.candidate}), room: 'signaling_room'});
    };

    rtcPeerConn.onnegotiationneeded = function(){
      rtcPeerConn.createOffer(sendLocalDesc,logError);
    };

    rtcPeerConn.onaddstream = function(evt){
      $scope.theirVideo.src = URL.createObjectURL(evt.stream);
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
    navigator.getUserMedia({
      audio: true,
      video: true
    }, function(stream){
      $scope.myVideo.src = URL.createObjectURL(stream);
      rtcPeerConn.addStream(stream);
    }, logError);

  };

  function sendLocalDesc(desc){
    rtcPeerConn.setLocalDescription(desc, function(){
      $scope.socket.emit('signal', {type: 'SDP', message: JSON.stringify({'sdp':rtcPeerConn.localDescription}), room: 'signaling_room'});
    }, logError);
  };

  function logError(error){
    console.log(error.name + ' ' + error.message );
  };


  $scope.socket.on('message', function(data){
    console.log(data.message);
    $scope.messages.push({msg: data.user + ' - '+  data.message});
    $scope.$digest();
  });

  $scope.send = function(msg){
    $scope.socket.emit('message', {message: msg, user: 'robot', room: 'room'});
    $scope.msg = '';
    console.log('msg sent');
  };
}])
