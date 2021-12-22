/**
 * NodeJS Front End
 * Written by Makaylah Cowan & Erik Cohen
 * file: app.js
 * CS330 Databases 11/2021
 */

const https = require('https');
const http = require('http');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const converter = require('json-2-csv');
const json2html = require('node-json2html');
const fs = require('fs');
const path = require('path');
const prettyjson = require('prettyjson');
let alert = require('alert');
var MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const CSV = require('csv-string');
const e = require('express');
// end import

const app = express();
const port = process.env.PORT || 5000;
var datum = {};
var d = {};
var current_image = 0;
var max_count = 0;


app.use(express.static('public'))
app.use(expressLayouts)
app.set('view engine', 'ejs')
var url = "mongodb+srv://secrets.USER:secrets.PASS@cluster0.ak5kh.mongodb.net/test?authSource=admin&replicaSet=atlas-ef2mq4-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true";
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(url);
}

//==================================================================================================================
// Helper Functions
//==================================================================================================================

csv2htmlTable = function(data) {
    var lines = data.split("\n"),
        output = [],
        i;

    headerstring ="<thead><tr><td>" + CSV.parse(lines[0])[0].join("</td><td>")+ "</td></tr></thead>";
    output.push( headerstring.replace(/\.|_/g, " "));
    for (i = 1; i < lines.length; i++) {// for each row

        

        if (lines[i].includes("https")){
            sub = lines[i].substring(lines[i].indexOf("https"),)
            link = sub.substring(0, sub.indexOf(",")).link(sub.substring(0, sub.indexOf(",")))
            end = sub.substring(sub.indexOf(","),)
            lines[i] = lines[i].substring(0,lines[i].indexOf("https")).concat(link).concat(end)
        }
        output.push("<tr><td>" // add data
                + CSV.parse(lines[i])[0].join("</td><td>")
                + "</td></tr>");     

    }

    output = '<table class="table table-bordered table-dark">' + output.join("") + "</table>"; //specify table style
    return output
}

tagTable = function(data) {
    var output = [];
    output.push("<thead><tr><td>" // add header
                + "Tags"
                + "</td></tr></thead>");

        output.push("<tr><td>" // add data
                    + data
                    + "</td></tr>");

    output = '<table class="table table-bordered table-dark">' + output.join("") + "</table>"; //specify table style
    return output
}

get_max = function(res){
    const client = new MongoClient(url)	
    client.connect(err => {
        console.log("Connected to MongoDB server...");
            // get data
        const DACST = client.db("DACST_Test"); // relevant database
        DACST.collection("Student_Response").count({}, function(error, numOfDocs){
            if(error){
                console.log(err);
                response.sendStatus(500);
                return;
            }
            client.close();
            max_count = numOfDocs - 1;
        });
    });
}


loadTag = function(res){
    const client = new MongoClient(url)	
    client.connect(err => {
        console.log("Connected to MongoDB server...")
            // get data
            const DACST = client.db("DACST_Test"); // relevant database
            DACST.collection("Student_Response").find({"CS_ID": current_image}).project({"image.Photo_link": 1, "image.Tags": 1}).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                        response.sendStatus(500);
                        return;
                    }
                    console.log(result)
                    var new_image_link = "no image linked";
                    var html_data = ["no image to tag"];
                    if (result[0]){
                        new_image_link = result[0]["image"]["Photo_link"];
                        html_data = tagTable(result[0]["image"]["Tags"]);
                    }

                    client.close();
                    res.render('tag', {title: 'Tag Images', image_table: html_data, imagelink: new_image_link, image_num: current_image} );
                });
            });
}

get_projection = function(request){
    var project = {};
    if(request.query.proj_semester){
        project["Semester"] = 1;
    }
    if(request.query.proj_administration){
        project["Administration"] = 1;
    }
    if(request.query.proj_class){
        project["Class"] = 1;
    }
    if(request.query.proj_stu_code){
        project["Student_code"] = 1;
    }
    if(request.query.proj_field){
        project["Word1"] = 1;
        project["Word2"] = 1;
        project["Word3"] = 1;
        project["Word4"] = 1;
    }
    if(request.query.proj_cs_day){
        project["Typical_CS_Day."] = 1;
    }
    if(request.query.proj_id){
        project["CS_ID"] = 1;
    }
    if(request.query.proj_code){
        project["CODE"] = 1;
    }
    if(request.query.proj_gender){
        project["Gender"] = 1;
    }
    if(request.query.proj_martin_score){
        project["image.Martin Score"] = 1;
    }
    if(request.query.proj_p_gender){
        project["image.Picture_Gender"] = 1;
    }
    if(request.query.proj_positive){
        project["image.Positive_Image"] = 1;
    }
    if(request.query.proj_photo){
        project["image.Photo_link"] = 1;
    }
    if(request.query.proj_tag){
        project["image.Tags"] = 1;
    }
    if(request.query.proj_image_action){
        project["image.Action"] = 1;
    }
    if( request.query.cs){
        if((Object.keys(project).length) > 0 ){        
            if(request.query.proj_field){
            project["computerScientist.Know"] = 1;
            }
            if(request.query.proj_field){
            project["computerScientist.Who"] = 1;
            }
        }else{
            project["computerScientist.CS_ID"] = 0;
        }
    }
    return project;
}



retrieve_stu_gender = function(request, genderlist){
    if(request.query.stu_genderF){
        genderlist.push("F");
    }
    if(request.query.stu_genderM){
        genderlist.push("M");
        genderlist.push("Male")
    }
    if(request.query.stu_genderN){
        genderlist.push("N/A");
        genderlist.push("");
        genderlist.push(".");
    }

    return genderlist
}

retrieve_image_gender = function(request, genderlist){
    if(request.query.image_gender){
        genderlist.push("F");
    }
    if(request.query.image_gender1){
        genderlist.push("M");
    }
    if(request.query.image_gender2){
        genderlist.push("N");
    }
    if(request.query.image_gender3){
        genderlist.push("N/A");
    }
    return genderlist
}

retrieve_administration = function(request, administration){
    if(request.query.administration){
        administration.push("0");
    }
    if(request.query.administration1){
        administration.push("1");
    }
    return administration
}

retrieve_tags = function(request, tags){
    if(request.query.tags != "")
    tags = request.query.tags.split(", ")
    return tags
}

get_query = function(request){
    var get_my_query = []
    var stu_gender = []
    var image_gender = []
    var administration = []
    var tags = []

    stu_gender = retrieve_stu_gender(request, stu_gender)
    if(stu_gender.length > 0 && stu_gender.length < 5){
        get_my_query.push({ id: "Gender", value: { "$in" : stu_gender } })
    }

    image_gender = retrieve_image_gender(request, image_gender)
    if(image_gender.length > 0 && image_gender.length < 5){
        get_my_query.push({ id: "image.Picture_Gender", value: { "$in" : image_gender } })
    }

    administration = retrieve_administration(request, administration)
    if(administration.length > 0 && administration.length < 2){
        get_my_query.push({ id: "Administration", value: { "$in" : administration } })
    }
    tags = retrieve_tags(request, tags);
    if(tags.length > 0){
        get_my_query.push({ id: "image.Tags", value: { "$in" : tags} })
    }

    return my_query = get_my_query.reduce((acc,cur) => ({ ...acc, [cur.id]: cur.value}), {})
}



//==================================================================================================================
// Routes
//==================================================================================================================

// Main page_____________________________________________________________________________________
app.get('', (req, res) => {
    res.render('index', {title: 'Home Page'} );
})

//Query main Page
app.get("/getdata", function (request, response){
    const my_query = get_query(request)
	const client = new MongoClient(url)	
    client.connect(err => {
        console.log("Connected to MongoDB server...")
            // get data
            const DACST = client.db("DACST_Test"); // relevant database
            if(request.query.cs){ //include data from collection "Computer_Scientist"
                projection = get_projection(request);
                DACST.collection("Student_Response").aggregate([
                    {
                      '$lookup': {
                        'from': 'Computer_Scientists', 
                        'localField': 'CS_ID', 
                        'foreignField': 'CS_ID', 
                        'as': 'computerScientist'
                      }
                    },
                    {$match: my_query}
                  ]).project(projection).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                        response.sendStatus(500);
                        return;
                    }
                    var temp = []
                    d = result
                    datum = temp
                    client.close();
                    converter.json2csv(result, (err, csv) => {
                        if (err) {
                            console.log(err);
                            response.sendStatus(500);
                            return;
                        }
                        html_data = csv2htmlTable(csv)
                        response.render('getdata', { data: temp, cs_table: html_data} );
                    });
                });
        
            }else{ //Regular Query
                projection = get_projection(request);
                DACST.collection("Student_Response").find( my_query, {"_id" : 0} ).project(projection).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                        response.sendStatus(500);
                        return;
                    }
                    // send data filtered by the t tag
                    d = result
                    var temp = []
                    for (var i = 0; i < result.length; i++){
                        temp[i] = JSON.stringify(result[i],  null, "\t") +"\n"
                    }
                    datum = temp
                    client.close();
                    converter.json2csv(result, (err, csv) => {
                        if (err) {
                            console.log(err);
                            response.sendStatus(500);
                            return;
                        }
                        html_data = csv2htmlTable(csv)
                        response.render('getdata', { data: temp, cs_table: html_data} );
                    });
                });
            }
            });
 });
// download funtionality
app.get("/download", function (request, response){
    converter.json2csv(d, (err, csv) => {
        if (err) {
            console.log(err);
            response.sendStatus(500);
            return;
        }
        //'csv'/data onto server
        fs.writeFileSync('data.csv', csv);
        console.log("downloading file")
        //push to client
        response.sendFile(path.resolve("./data.csv"));
    });
    //response.render('getdata', { data: datum} );
});

// Tag Page + button functions_______________________________________________________________________________
app.get('/tag', (req, res) => {
    get_max();
    current_image = 0;
    loadTag(res);
})
app.get('/next_image', (req, res) => {
    get_max();
    current_image++;
    if(current_image > max_count){
        current_image = 0;
    }
    loadTag(res);
})
app.get('/prev_image', (req, res) => {
    current_image--;
    get_max();
    if(current_image < 0){
        current_image = max_count;
    }
    loadTag(res);
})
app.get('/teleport', (req, res) => {
    new_img_num = parseInt(req.query.idnum);
    get_max();
    if(new_img_num >= 0 && new_img_num <= max_count){
        current_image = new_img_num;
    }else{
        alert("Out of range! choose between 0 and " + max_count)
        return
    }
    loadTag(res);
})
// data display page
app.get("/update-tags", function (request, response){
    var tag_list = []
    if(request.query.tags && request.query.tags != ""){
        tag_list = request.query.tags.split(', ');
    }
	const client = new MongoClient(url)	
    client.connect(err => {
        console.log("Connected to MongoDB server...")
            // get data
            const DACST = client.db("DACST_Test"); // relevant database
            DACST.collection("Student_Response").updateOne({"CS_ID": current_image},{ $push: { "image.Tags": { $each: tag_list } } }, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
                client.close();
              });
        //return to /tag
        loadTag(response);
    });

 });

 app.get("/remove-tags", function (request, response){
    var tag_list = []
    if(request.query.removetags && request.query.removetags != ""){
        tag_list = request.query.removetags.split(', ');
    }
	const client = new MongoClient(url)	
    client.connect(err => {
        console.log("Connected to MongoDB server...")
            // get data
            const DACST = client.db("DACST_Test"); // relevant database
            DACST.collection("Student_Response").updateOne({"CS_ID": current_image},{ $pull: {"image.Tags": {$in:tag_list} }}, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
                client.close();
              });
        //return to /tag
        loadTag(response);
    });
 });

// About Page_________________________________________________________________________________
app.get('/about', (req, res) => {
    res.render('info', {title: 'About The DACST'} );
})

// Contact Page_______________________________________________________________________________
app.get("/contact", function (request, response){
    response.render('contact', {title: 'Contact page'} );
});

// Listen on Port 5000
app.listen(port, () => console.info(`App listening on port ${port}`))

