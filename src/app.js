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

function get(id, callback) {
    tasks(function (err, data) {
        if (err) return callback(err);

        var match, index = -1;

        for (var i = 0; i < data.length && ! match; i++) {
            if (data[i].id === id) {
                match = data[i];
                index = i;
            }
        }

        callback(null, match, index);
    });
}

function remove(id, callback) {
    get(id, function (err, task) {
        queue.lrem(TASKS_KEY, 0, JSON.stringify(task), function (err, result) {
            callback(err);
        });
    });
}

function update(id, data, callback) {
    get(id, function (err, task, index) {
        if (err) return callback(err);

        Object.keys(data).forEach(function (key) {
            if (task.hasOwnProperty(key)) { // Prevent data storage
                task[key] = data[key];
            }
        });

        queue.lset(TASKS_KEY, index, JSON.stringify(task), function (err) {
            callback(err, task);
        });
    });
}

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
app.use(multer());

app.use(express.static(__dirname + '/../public'));

app.use(function (req, res, next) {
    console.log(req.url, req.body);
    next(req, res);
});

app.post('/tasks', function (req, res) {
    create(req.body.task, function (err, task) {
        res.send(err ? { error: err } : task);
    });
});

app.get('/tasks', function (req, res) {
    tasks(function (err, data) {
        res.send(data);
    });
});

app.get('/tasks/:id', function (req, res) {
    get(req.params.id, function (err, task) {
        res.send(err ? { error: err } : task);
    });
});

app.delete('/tasks/:id', function (req, res) {
    remove(req.params.id, function (err) {
        res.send(err ? { error: err } : { result: 'success' });
    });
});

app.put('/tasks/:id', function (req, res) {
    update(req.params.id, req.body, function (err, task) {
        res.send(err ? { error: err } : task);
    });
});

app.listen(WEB_PORT || 8000);
