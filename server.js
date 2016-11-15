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
var User = require('./app/models/User');
var Project = require('./app/models/Project');

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

/*app.post('/setup', function(req, res) {



    var newUser = new User({
        displayName: req.body.displayName,
        name:req.body.name,
        password:req.body.password,
        admin:req.body.admin
    })

    newUser.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
});*/

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

apiRoutes.options('*',function (req, res, next) {
    res.status(200).send();

});



apiRoutes.route('/users').get(function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
}).put(function (req,res){
    var newUser = new User({
        displayName: req.body.displayName,
        name:req.body.name,
        password:req.body.password,
        admin:req.body.admin
    })

    newUser.save(function(err) {
        if (err) throw err;

        console.log('User created successfully');
        res.json({ success: true });
    });
});

apiRoutes.route('/projects').get(function (req,res) {
    Project.find({},function (err, projects) {
        res.json(projects);
    })
}).post(function (req,res) {
    var newProject = new Project({
        duration: req.body.duration,
        name: req.body.name,
        tasks: req.body.tasks
    });
    newProject.markModified('tasks');
    newProject.save(function (err) {
        if(err) throw err;

        console.log('Project created successfully');
        res.json({success: true,message: "Project created successfully"});


    })
})

apiRoutes.route('/tasks').get(function(req, res) {
    Task.find(function(err, tasks) {
        if (err)
            res.send(err);

        res.json({ success: true, rows : tasks});
    });
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});



apiRoutes.route('/tasks').post(function(req,res){
    var task = new Task();

    task.name = req.body[0].name;
    task.description = req.body[0].description;
    task.state = req.body[0].state;
    task.priority = req.body[0].priority;
    task.created = req.body[0].created;
    task.createdBy = req.body[0].createdBy;
    task.assignedTo = req.body[0].assignedTo;
    task.startDate = req.body[0].startDate;
    task.duration = req.body[0].duration;
    task.project = req.body[0].project;


    task.save(function(err) {
        if (err)
            res.send(err);

        res.json({success: true, message: 'Task created!' });
    });

});


apiRoutes.route('/tasks/:task_id').delete(function (req,res) {
    Task.remove({
        _id: req.params.task_id
    }, function (err, bear) {
        if (err)
            res.send(err);

        res.json({success: true,message: 'Successfully deleted'});
    });
}).get(function(req,res){
    Task.findById(req.params.task_id, function(err, task) {
        if (err)
            res.send(err);
        res.json({success: true, rows : task});
    });
}).put(function(req,res){
    Task.findById(req.params.task_id, function(err, task) {
        if (err)
            res.send(err);

        task.name = req.body[0].name;
        task.description = req.body[0].description;
        task.state = req.body[0].state;
        task.priority = req.body[0].priority;
        task.created = req.body[0].created;
        task.createdBy = req.body[0].createdBy;
        task.assignedTo = req.body[0].assignedTo;
        task.startDate = req.body[0].startDate;
        task.duration = req.body[0].duration;
        task.project = req.body[0].project;


        // save the bear
        task.save(function(err) {
            if (err)
                res.send(err);

            res.json({success: true, message: 'Task updated!' });
        });
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

