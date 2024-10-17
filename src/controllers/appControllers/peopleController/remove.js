const mongoose = require('mongoose');

const Client = mongoose.model('Client');
const Company = mongoose.model('Company');

const remove = async (Model, req, res) => {
  // cannot delete client if it has one invoice or Client:
  // check if client has invoices or quotes:
  const { id } = req.params;

  const client = await Client.findOne({
    people: id,
    removed: false,
  }).exec();
  if (client) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete person if they are attached to any company or are a client',
    });
  }

  const company = await Company.findOne({
    mainContact: id,
    removed: false,
  }).exec();
  if (company) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Cannot delete person if they are attached to any company or are a client',
    });
  }

  // If no Company or quotes, delete the client
  const result = await Model.findByIdAndDelete(id).exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No person found with this id: ' + id,
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully deleted the person with id: ' + id,
  });
};

module.exports = remove;
