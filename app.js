
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var PrintProvider = require('./printprovider-mongodb').PrintProvider;
var  fs = require('fs');
var ImageProcessing = require('./imageprocessing').ImageProcessing;
var formidable = require('formidable');

var app = module.exports = express();


// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/public/uploaded' }));

app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var printProvider = new PrintProvider('localhost', 27017);
var imageProcessing = new ImageProcessing();

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// routes
app.get('/',  function(req, res){

    printProvider.getAll(function(error,prints){

        if(error)
            console.log('error while find = '+error);

        console.log('prints='+JSON.stringify(prints));

        res.render('index', { title: 'Tapaprint', prints: prints });
    });


});


app.get('/show/:name', function(req,res){

    printProvider.findByName(req.params.name, function(error,print){

        if(error) console.log('error while print show - '+error);


        res.render('show_print', { title: 'Print anzeigen', print:print });

    });

});

app.get('/print/new', function(req,res){
    res.render('new_print', { title: 'Neuen Print hinzufügen' });
});


app.get('/image/small/:file', function(req,res){

    var target_path = '/data/tapaprint/small/' + req.params.file;

    console.log('/image/='+req.params.file);

    fs.readFile(target_path, "binary", function(error, file) {
        if(error) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(error + "\n");
            res.end();
        } else {

            res.writeHead(200, {"Content-Type": "image/png"});
            res.write(file, "binary");
            res.end();
        }

    });

});

app.get('/image/:file', function(req,res){

    var target_path = '/data/tapaprint/' + req.params.file;

    console.log('/image/='+req.params.file);

    fs.readFile(target_path, "binary", function(error, file) {
        if(error) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(error + "\n");
            res.end();
        } else {

            res.writeHead(200, {"Content-Type": "image/png"});
            res.write(file, "binary");
            res.end();
        }

    });

});

//save new print image and create a thumbnail
app.post('/print/new', function(req,res){

    // get the temporary location of the file
    var tmp_path = req.files.image.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    target_path = '/data/tapaprint/' + req.files.image.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) console.log('error while rename = '+err);


        imageProcessing.resizeToSmall(req.files.image.name,function(error){
            if(error) console.log('error while creating thumbnail')


            printProvider.save({name: req.param('name'),
                                path: req.files.image.name,
                                data:[]}, function(error,print){

                if(error)console.log('Error while saving = '+error);

                res.redirect('/');
            })


        })

        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) console.log('error while unlink = '+err);
        });
    });

});


//save new sub image from a print
app.post('/print/:name/images', function(req,res){

    //var files = req.files.image;

   // console.log('upload multiple images - '+files.length);


  //  for(var image in files){
//        console.log('upload - '+JSON.stringify(image));
//    }


    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];

    form.uploadDir = /data/;

    form.on('field', function(field, value) {
            console.log("sss"+field, value);
            fields.push([field, value]);
        })
        .on('file', function(field, file) {
            console.log("sss2"+field, file);
            files.push([field, file]);
        })
        .on('end', function() {
            console.log('-> upload done');

            res.redirect('/show/'+req.params.name);
        });
    form.parse(req);

});


//save new sub image from a print
app.post('/print/:name/new', function(req,res){

    console.log('print/name='+req.params.name);

    console.log('image - '+JSON.stringify(req.files.image));

    // get the temporary location of the file
    var tmp_path = req.files.image.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    target_path = '/data/tapaprint/' + req.files.image.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;

        imageProcessing.resizeToSmall(req.files.image.name,function(err){
            if (err) console.log('error while createThumbnail = '+err);

            //update print after thumbnail was created and show
            printProvider.update(req.params.name,{$push:{data: req.files.image.name}}, function(error,print){
                if(error)console.log('Error while saving = '+error);

                res.redirect('/show/'+req.params.name);
            });

        });


        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;

        });
    });

});


app.post('/print/remove/:name', function(req, res){

    console.log("remove ");

    printProvider.remove({name:req.params.name}, function(error){

        if(error)
            console.log("Error while removing, error="+error);

        res.redirect("/");
    });

});


app.post('/print/:name/remove/:filename', function(req, res){

    console.log("remove -"+req.params.name+", "+req.params.filename);

    printProvider.removePrintImage({name:req.params.name,filename:req.params.filename}, function(error){

        if(error)
            console.log("Error while removing, error="+error);

        res.redirect("/show/"+req.params.name);
    });

});







http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
