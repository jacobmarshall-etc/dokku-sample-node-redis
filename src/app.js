var REDIS_PORT = process.env.REDIS_PORT,
    REDIS_IP = process.env.REDIS_IP,
    WEB_PORT = process.env.PORT,
    TASKS_KEY = 'tasks';

var redis = require('redis'),
    queue = redis.createClient(REDIS_PORT, REDIS_IP),
    express = require('express'),
    parser = require('body-parser'),
    multer = require('multer'),
    app = express();

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
app.use(multer());

app.use(express.static(__dirname + '/../public'));

app.put('/tasks', function (req, res) {
    console.log(req.body);
});

app.get('/tasks', function (req, res) {
    queue.lrange([TASKS_KEY, 0, -1], function (err, data) {
        console.log(err, data);
    });
});

app.listen(WEB_PORT || 8000);
