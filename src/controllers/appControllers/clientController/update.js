const mongoose = require('mongoose');

const People = mongoose.model('People');
const Company = mongoose.model('Company');

const update = async (Model, req, res) => {
  const { id } = req.params; // Récupération de l'ID du client à mettre à jour
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing client ID',
    });
  }

  try {
    // Vérification si le client existe
    const existingClient = await Model.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or already removed',
      });
    }

    if (req.body.type === 'people') {
      // Mise à jour du type 'people'
      if (!req.body.people) {
        return res.status(403).json({
          success: false,
          message: 'Please select a people',
        });
      } else {
        // Vérification si une autre personne est déjà un client
        let existingPersonClient = await Model.findOne({
          people: req.body.people,
          _id: { $ne: id }, // Exclusion de l'actuel client
          removed: false,
        });

        if (existingPersonClient) {
          return res.status(403).json({
            success: false,
            message: 'Another client with this person already exists',
          });
        }

        let { firstname, lastname } = await People.findOneAndUpdate(
          {
            _id: req.body.people,
            removed: false,
          },
          { isClient: true },
          {
            new: true,
            runValidators: true,
          }
        ).exec();

        req.body.name = firstname + ' ' + lastname;
        req.body.company = undefined; // Suppression du champ company pour ce type
      }
    } else if (req.body.type === 'company') {
      // Mise à jour du type 'company'
      if (!req.body.company) {
        return res.status(403).json({
          success: false,
          message: 'Please select a company',
        });
      } else {
        // Vérification si une autre entreprise est déjà un client
        let existingCompanyClient = await Model.findOne({
          company: req.body.company,
          _id: { $ne: id }, // Exclusion de l'actuel client
          removed: false,
        });

        if (existingCompanyClient) {
          return res.status(403).json({
            success: false,
            message: 'Another client with this company already exists',
          });
        }

        let { name } = await Company.findOneAndUpdate(
          {
            _id: req.body.company,
            removed: false,
          },
          { isClient: true },
          {
            new: true,
            runValidators: true,
          }
        ).exec();

        req.body.name = name;
        req.body.people = undefined; // Suppression du champ people pour ce type
      }
    }

    // Mise à jour du client existant
    req.body.updatedAt = Date.now(); // Met à jour la date de modification
    const updatedClient = await Model.findOneAndUpdate(
      { _id: id },
      { ...req.body },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedClient) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update the client',
      });
    }

    // Réponse en cas de succès
    return res.status(200).json({
      success: true,
      result: updatedClient,
      message: 'Successfully updated the client',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating the client',
      error: error.message,
    });
  }
};

module.exports = update;
