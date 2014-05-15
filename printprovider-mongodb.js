/**
 * Created by vitalifichtner on 23.04.14.
 */

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var db;



PrintProvider = function(host,port){
  this.db = new Db('taptoprint', new Server(host,port,{auto_reconnect: true},{}));
  this.db.open(function() {});

}



PrintProvider.prototype.getAll = function(callback){

    console.log('getAll');

    this.db.collection('prints').find().toArray(callback);

}

PrintProvider.prototype.findByName = function(name, callback){

    console.log('findById -'+name);
    this.db.collection('prints').findOne({name:name},callback);

}


PrintProvider.prototype.update = function(name,data, callback){

    console.log('findById -'+name);
    this.db.collection('prints').update({name:name},data,callback);

}


PrintProvider.prototype.save = function(print, callback){

    console.log('save -'+print.name);
    this.db.collection('prints').insert(print);

    callback(null,print);
}

PrintProvider.prototype.remove = function(print, callback){
    this.db.collection('prints').remove(print);

    callback(null);
}


PrintProvider.prototype.removePrintImage = function(printImage, callback){

    console.log("printImage - "+printImage.name+", "+printImage.filename);

    this.db.collection('prints').update({name:printImage.name},
                {$pull:{data: printImage.filename}},callback);

    callback(null);
}


exports.PrintProvider = PrintProvider;