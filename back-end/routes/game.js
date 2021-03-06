const socketIO = require('socket.io');
const crypto = require('crypto');

const securekey = "key";
let dres = "";

//function
const cipher = (value, key) => {
    const encrypt = crypto.createCipher('des', key);
    const encryptResult = encrypt.update(value, 'utf8', 'base64') + encrypt.final(
        'base64'
    );
    console.log(encryptResult);
    return encryptResult;
}

const decipher = (value, key) => {
    const decode = crypto.createDecipher('des', key);
    const decodeResult = decode.update(value, 'base64', 'utf8') + decode.final(
        'utf8'
    )
    console.log(decodeResult)
    return decodeResult;
}

//process start
module.exports = (server) => {
    console.log("check");
    const io = socketIO(server, {
        cors: {
            origin: "*"
        }
    });

    // variable
    let packet = {
        from: {
            name: "",
            userid: ""
        },
        msg: "",
        res: true
    };

    let gameInfo = {
        order: 0,
        participants: [],
        startword: 'a',
        res: true,
        res_message: "",

        // obj clear
        clear() {
            this.order = 0;
            this.participants = [];
            this.startword = 'a';
            this.res = true;
            this.res_message = "";
        },
        // check order
        isOrder(username) {
            if (username === this.participants[this.order]) 
                return true;
            else 
                return false;
            }
        ,

        // check first word
        isStartWord(statement) {
            if (statement.charAt(0) === this.startword) 
                return true;
            else {
                console.log(
                    "False isStartWord(), state.chatAt(0) === " + statement.charAt(0) + "startword " +
                    "=== " + this.startword
                );
                return false;
            }
        },

        // check user & msg
        isCheck(state, username) {
            if (this.isOrder(username) && this.isStartWord(state)) 
                return true;
            else 
                return false;
            }
        
    }

    // socket
    io.on('connection', function (socket) {

        // event : login (== access) (input data : name / userid)
        socket.on('login', function (data) {
            console.log(
                'Client logged-in:\n name:' + data.name + '\n userid:' + data.userid
            );
            //
            // socket info
            socket.name = data.name;
            socket.userid = data.userid;

            //config gameInfo
            gameInfo
                .participants
                .push(data.name);

            // config packet
            packet.from.name = data.name;
            packet.msg = data.name + " has joined";
            packet.order = gameInfo.participants[gameInfo.order];

            // send
            io.emit('login', packet);

        });

        // event : chat (input data : name / msg)
        socket.on('chat', function (data) {
            console.log('Message from %s: %s', socket.name, data.msg);

            // config packet
            packet.from.name = socket.name;
            packet.from.userid = socket.userid;
            packet.msg = data.msg;
            packet.res = true;

            // send
            io.emit('chat', packet);

            // ???????????? ????????? ?????????????????? ????????? ?????? ????????????????????? ???????????? ????????????  socket.broadcast.emit('chat', msg);
            //
            // ???????????? ????????? ???????????????????????? ???????????? ????????????  socket.emit('chat', msg);
            //
            // ????????? ?????? ????????????????????? ???????????? ????????????  io.emit('chat', msg);
            //
            // ?????? ???????????????????????? ???????????? ???????????? io.to(id).emit('chat', data);
        });
        //

        // event : game
        socket.on('game', (data) => {
            console.log(data);
            dres = decipher(data, securekey);
            data = JSON.parse(dres);

            if (gameInfo.isCheck(data.msg, socket.name)) {
                gameInfo.order = (gameInfo.order + 1) % gameInfo.participants.length;
                gameInfo.startword = data
                    .msg
                    .charAt(data.msg.length - 1);
                gameInfo.res = true;
                gameInfo.res_message = "success";
            } else {
                gameInfo.res = false;
                if (gameInfo.isOrder(socket.name)) {
                    gameInfo.res_message = "startword is wrong! startword is " + gameInfo.startword;
                } else {
                    gameInfo.res_message = "you are not in order yet!";
                }
            }

            // config packet
            packet.from.name = socket.name;
            packet.from.userid = socket.userid;
            packet.msg = data.msg;
            packet.startword = gameInfo.startword;
            packet.order = gameInfo.participants[gameInfo.order];

            // send 
            if (gameInfo.res) {
                packet.res = true;
                packet.comment = gameInfo.res_message;
                io.emit('game', cipher(JSON.stringify(packet), securekey));
            } else {
                packet.res = false;
                packet.comment = gameInfo.res_message;
                socket.emit('game', cipher(JSON.stringify(packet), securekey));
            }

            console.dir(packet);
        });

        // event : disconnected force client disconnect from server
        socket.on('forceDisconnect', function () {

            // clear gameinfo
            gameInfo.clear();

            // config packet
            packet.from.name = socket.name;
            packet.from.userid = socket.userid;
            packet.msg = 'user disconnected: ' + socket.name;

            // send
            io.emit('chat', packet);

            socket.disconnect();
        });
        socket.on('disconnect', function () {

            // clear gameinfo
            gameInfo.clear();
            // config packet
            packet.from.name = socket.name;
            packet.from.userid = socket.userid;
            packet.msg = 'user disconnected: ' + socket.name;

            // send
            io.emit('chat', packet);

            console.log('user disconnected: ' + socket.name);
        });
    });
};