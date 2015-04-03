var REDIS_PORT = process.env.REDIS_PORT,
    REDIS_IP = process.env.REDIS_IP,
    WEB_PORT = process.env.PORT,
    TASKS_KEY = 'tasks';

var redis = require('redis'),
    queue = redis.createClient(REDIS_PORT, REDIS_IP),
    express = require('express'),
    parser = require('body-parser'),
    multer = require('multer'),
    uuid = require('node-uuid').v4,
    app = express();

function tasks(callback) {
    queue.lrange(TASKS_KEY, 0, -1, function (err, result) {
        callback(err, result.map(function (task) {
            return JSON.parse(task);
        }));
    });
}

function create(task, callback) {
    var data = {
        id: uuid(),
        task: task,
        complete: false
    };

    queue.rpush(TASKS_KEY, JSON.stringify(data), function (err, result) {
        callback(err, data);
    });
}

function remove(id, callback) {
    tasks(function (data) {
        data.forEach(function (task) {
            if (task.id === id) {
                queue.lrem(TASKS_KEY, 0, JSON.stringify(task), function (err, result) {
                    callback(err);
                });
            }
        });
    });
}

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
app.use(multer());

app.use(express.static(__dirname + '/../public'));

app.put('/tasks', function (req, res) {
    create(req.body.task, function (err, task) {
        res.send(err ? { error: err } : task);
    });
});

app.get('/tasks', function (req, res) {
    tasks(function (data) {
        res.send(data);
    });
});

app.delete('/task/:id', function (req, res) {
    remove(req.params.id, function (err) {
        res.send(err ? { error: err } : { result: 'success' });
    });
});

app.listen(WEB_PORT || 8000);
