/**
 * Created by sprucewerk on 23.04.14.
 */

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var  fs = require('fs');
var db;

var imagePath= '/data/tapaprint/';


PrintProvider = function(host,port){
  this.db = new Db('taptoprint', new Server(host,port,{auto_reconnect: true},{}));
  this.db.open(function() {});

}



PrintProvider.prototype.getAll = function(callback){

    console.log('getAll');

    this.db.collection('prints').find().toArray(callback);

}

PrintProvider.prototype.findByName = function(name, callback){

    console.log('findByName -'+name);
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

    console.log('remove print='+JSON.stringify(print));

    this.findByName(print.name, function(callback,foundPrint){

        var images = foundPrint.data;

        for(var item in images){
            deleteImage(images[item]);
        }

        //delete print image (main image)
        deleteImage(foundPrint.path);

    });


    this.db.collection('prints').remove(print);

    callback(null);
}



PrintProvider.prototype.removePrintImage = function(printImage, callback){

    console.log("printImage - "+printImage.name+", "+printImage.filename);

    this.db.collection('prints').update({name:printImage.name},
                {$pull:{data: printImage.filename}},callback);

    //delete image (small+large)
    deleteImage(printImage.filename);

    callback(null);
}


function deleteImage(imageName){
    var largeImagePath = imagePath+imageName;
    //delete large image
    fs.unlink(largeImagePath, function(err) {
        if (err) console.log('error while delete image = '+err);

        console.log('deleted large image - '+largeImagePath);
    });

    //delete small image
    var smallImagePath = imagePath+'/small/'+imageName;

    fs.unlink(smallImagePath, function(err) {
        if (err) console.log('error while delete image = '+err);

        console.log('deleted small image - '+smallImagePath);
    });
}

exports.PrintProvider = PrintProvider;