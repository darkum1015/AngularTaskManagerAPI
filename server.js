// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./app/config'); // get our config file

var Task   = require('./app/models/Task');
var User = require('./app/models/User')

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8300; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));


var apiRoutes = express.Router();

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

apiRoutes.route('/tasks').post(function(req,res){
    var task = new Task();

    task.name = req.body.name;
    task.description = req.body.description;
    task.state = req.body.state;
    task.priority = req.body.priority;
    task.created = req.body.created;
    task.createdBy = req.body.createdBy;
    task.assignedTo = req.body.assignedTo;
    task.startDate = req.body.startDate;
    task.duration = req.body.duration;

    // set the bears name (comes from the request)

    // save the bear and check for errors
    task.save(function(err) {
        if (err)
            res.send(err);

        res.json({ message: 'Task created!' });
    });

}).get(function(req, res) {
    Task.find(function(err, tasks) {
        if (err)
            res.send(err);

        res.json({ success: true, rows : tasks});
    });
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    next();
});


// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);

