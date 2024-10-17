const mongoose = require('mongoose');

const Client = mongoose.model('Client');
const People = mongoose.model('People');

const remove = async (Model, req, res) => {
  const { id } = req.params;

  // First, check if there is at least one client or person associated with the company
  const client = await Client.findOne({
    company: id,
    removed: false,
  }).exec();
  if (client) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete company if it is attached to any people or clients',
    });
  }
  
  const people = await People.findOne({
    company: id,
    removed: false,
  }).exec();
  if (people) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete company if it is attached to any people or clients',
    });
  }

  // If no associated clients or people, delete the company
  const result = await Model.findByIdAndDelete(id).exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No company found with this id: ' + id,
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully deleted the company with id: ' + id,
  });
};

module.exports = remove;
