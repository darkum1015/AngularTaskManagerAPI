var mongoose = require('mongoose');
var schema = mongoose.Schema;

var ProjectSchema = new schema({
   name:{type: String},
   duration:{type: String},
   tasks: {type: Array}
});

module.exports = mongoose.model('Project', ProjectSchema);