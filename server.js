var express = require('express.io');
var app = express();

app.http().io();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index.ejs');
});

app.io.route('ready', function(req){
  req.io.join(req.data.chat_room);//global room
  req.io.join(req.data.signal_room);//private room (signaling magic)
  app.io.room(req.data).broadcast('announce', {message:
    'New Client in the' + req.data + ' room.'});
});

app.io.route('message', function(req){
  app.io.room(req.data.room).broadcast('message',{
    user: req.data.user,
    message: req.data.message
  });
});

app.io.route('signal', function(req){
  req.io.room(req.data.room).broadcast('signaling_message',{
    type: req.data.type,
    message: req.data.message
  });
});

app.io.on('connection', function(socket){
  console.log('An user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    socket.emit('chat message', msg);
    console.log('message:' + msg);
  });

});

var port = process.env.PORT || 3000;
app.listen(3000, function(){
  console.log('Running at 127.0.0.1 : 3000');
});
