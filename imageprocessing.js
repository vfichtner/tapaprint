/**
 * Created by sprucewerk on 06.05.14.
 */
var im = require('imagemagick');

ImageProcessing = function(){

}


ImageProcessing.prototype.resizeToLarge = function(fileName,callback){

    //make a thumbnail
    im.resize({
        srcPath: '/data/tapaprint/'+fileName,
        dstPath: '/data/tapaprint/'+fileName,
        quality: 0.8,
        width:   300
    }, function(err, stdout, stderr){
        if (err){
            console.log('error while resize = '+err);
            callback(err);
        }
        callback(null);
    });

}



ImageProcessing.prototype.resizeToSmall = function(fileName,callback){

    //make a thumbnail
    im.resize({
        srcPath: '/data/tapaprint/'+fileName,
        dstPath: '/data/tapaprint/small/'+fileName,
        quality: 0.8,
        width:   300
    }, function(err, stdout, stderr){
        if (err){
            console.log('error while resize = '+err);
            callback(err);
        }
        callback(null);
    });

}



exports.ImageProcessing = ImageProcessing;