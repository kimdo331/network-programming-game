// router
const express = require('express');
const router = express.Router();

// middleware
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

let names = new Array();
let json = {
    numPeople: 0,
    strPeople: names,
    isStart: false
};
let complete = {
    numPeople: 0,
    strPeople: names,
    isStart: false
};

//post
router
    .route('/')
    .post((req, res) => {
         //console.log(req.body);
         //console.dir(json);
        flag = req.body.flag;

        json.isStart = false;
        if (flag == "exit") {
            json
                .strPeople
                .splice(json.strPeople.indexOf(req.body.name), 1);
            json.numPeople = json.numPeople - 1;
        }

        if (flag == "access") {
            if (!json.strPeople.includes(req.body.name)) {
                json.numPeople = json.numPeople + 1;
                json
                    .strPeople
                    .push(req.body.name);

                if (json.numPeople == 3) {
                    json.isStart = true;
                    
                    complete = JSON.parse(JSON.stringify(json));

                    json.isStart = false;
                    json.numPeople = 0;
                    json.strPeople = [];
                }
            }
        }

        if(complete.strPeople.includes(req.body.name)) {
            res.json(complete);
        }
        else{
            res.json(json);
        }
    })

// get token 관련 테스트 코드 export
module.exports = router;