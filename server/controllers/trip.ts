import BaseCtrl from './base';
import Trip from '../models/trip';
import {ITripDocument } from '../models/types';


export default class TripCtrl extends BaseCtrl<ITripDocument> {
  model = Trip;
  projection: '_id, name, creator, createdAt';

  setCreator = (req, res, next) => {
    req.body.creator = req.user._id;
    next();
  }

  getMyList = (req, res) =>
    this.model.find({creator: req.user._id}, this.projection)
      .populate('creator').select('-pois')
      .then(l => res.json(l))
      .catch(err => res.status(500).json({message: err}));

  getListPeg = (req, res) => {

    const limit = +req.query?.size || 10;
    const page = req.query?.page || 0;

    this.model.find({}, this.projection)
      .skip(limit*page)
      .limit(limit)
      .select('-pois')
      .then(l => res.json(l))
      .catch(err => res.status(500).json({message: err}));
  }

  addPoi = (req, res, next) =>
    this.model.findOneAndUpdate({ _id: req[this.model.collection.collectionName]._id }, {$addToSet: {pois: req.pois._id}},{new: true})
      .then(m => (this.model.hasOwnProperty('load')) ? this.model['load'](m._id) : m)
      .then(m => req[this.model.collection.collectionName] = m)
      .then(() => next())
      .catch(err => {
        console.error(err);
        res.status(500).json({message: err});
      });

  deletePoi = (req, res, next) =>
    this.model.findOneAndUpdate({ _id: req.trips._id }, {$pull: {pois: req.pois._id}},{new: true})
      .then(m => (this.model.hasOwnProperty('load')) ? this.model['load'](m._id) : m)
      .then(m => req[this.model.collection.collectionName] = m)
      .then(() => next())
      .catch(err => {
        console.error(err);
        res.status(500).json({message: err});
      });
}

