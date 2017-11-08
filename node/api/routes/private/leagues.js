const mongoose = require('mongoose');
const winston = require('winston');
const League = mongoose.model('League');
const ObjectId = mongoose.Types.ObjectId;

async function deleteOne(req, res) {
  const league = req.league
  try {
    await league.remove();
    res.status(200).send();
  } catch (error) {
    winston.error(error);
    res.status(500).json(error);
  }
}

async function updateOne(req, res) {
  const updateFields = 'administrators name teams fixtures'.split(' ');
  const updateParams = {};

  try {
    Object.keys(req.body).forEach(function (key) {
      if(updateFields.indexOf(key)) {
        updateParams[key] = req.body[key]
      }
    })

    await League.update({_id: ObjectId(req.params.id)}, updateParams);
    const league = await League.findById(ObjectId(req.params.id));
    res.json(league);
  } catch (error) {
    winston.error(error);
    res.status(500).json(error);
  }
}

async function duplicateLeagueUpdateCheck(currentLeagueId, leagueName) {
  const league = await League.findOne({name: leagueName});
  if (league && league._id !== currentLeagueId) {
    throw new Error('League name already in use');
  }
}

module.exports = {
  deleteOne,
  updateOne,
}
