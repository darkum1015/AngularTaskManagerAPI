var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TaskSchema   = new Schema({
    name: {type: String},
    description: {type: String},
    project:{type:String},
    state: {type: String},
    priority: {type: String},
    created: {type: String},
    createdBy: {type: String},
    assignedTo: {type: String},
    startDate: {type: String},
    duration: {type: String}

});

module.exports = mongoose.model('Task', TaskSchema);
