const mongoose = require('mongoose');

const remove = async (Model, req, res) => {
 // Physically delete the document from the database
 const result = await Model.findOneAndDelete({ _id: req.params.id, removed: false }).exec();

 if (!result) {
   return res.status(404).json({
     success: false,
     result: null,
     message: 'No document found or already removed',
   });
 } else {
   return res.status(200).json({
     success: true,
     result,
     message: 'Document successfully deleted',
   });
 }
};
module.exports = remove;
