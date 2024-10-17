exports.migrate = (result) => {
  debugger;
  console.log(result);
  let newData = {};
  newData._id = result._id;
  newData.type = result.type;
  newData.name = result.name;
  newData.total = result.total;
  newData.company = result.company;
  return newData;
};
