const log4js = require('log4js');
log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'log.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});
const logger = log4js.getLogger('log');
const fs = require('fs');
var parse = require('csv-parse');
global.jQuery = require('jquery')
var readlineSync = require('readline-sync');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var moment = require("moment");
var firstAttempt = true;


//while (1){
   // if (!firstAttempt){
   //     console.log("Feel free to make another request")
   // }
    //var inputPath = readlineSync.question('Name of file?');
   // var request = readlineSync.question('Request?');
    //request = request.substring(5)
   // request = request.toLowerCase()
    typeCheck("Transactions2014.csv", "all")
  //  firstAttempt = false
//}
//typeCheck("Transactions2012.xml", "jon a")
var startDate = moment("1899-12-30")

function typeCheck(path, request) {
    n = path.lastIndexOf(".")
    pathSub = path.substr(n)
    if (request === "all") {
        if (pathSub === ".csv") {
            readCSV(path)
        }
        else if (pathSub === ".json") {
            readJSON(path)
        }
        else if (pathSub === ".xml") {
            readXML(path)
        }
        else {
            console.log("invalid file name!")
            return
        }
    }
    else {
        if (pathSub === ".csv") {
            listNameCSV(path, request)
        }
        else if (pathSub === ".json") {
            listNameJSON(path, request)
        }
        else if (pathSub === ".xml") {
            listNameXML(path, request)
        }
    }
}

function readCSV(inputPath){
    fs.readFile(inputPath, function (err, fileData) {
        parse(fileData, {columns: true, trim: true}, function (err, rowsCSV) {
            listAllCSV(rowsCSV)
        })
    })
}

function readJSON(path){
    try{
        var obj = require("./"+path);
    }
    catch (e){
        logger.error("They seem to have entered an incorrect file name")
        console.log("Somethinfgs egone WRONG!")
        return
    }
    listAllJSON(obj)
}

function readXML(path){
    fs.readFile("./"+path, function(err, data) {
        parser.parseString(data, function (err, result) {
            listAllXML(result)
        });
    });
}

function listAllCSV (rows){
    try{
        var uniqueNames = [];
        for(i = 0; i< rows.length; i++){
            if(uniqueNames.indexOf(rows[i]["From"]) === -1){
                uniqueNames.push(rows[i]["From"]);
            }
        }
        setupOutput(uniqueNames, rows, ".csv")
    }
    catch (e){
        logger.error("They seem to have entered an incorrect file name")
        console.log("uh, there's a problem")
        return
    }
}

function listAllJSON(rows){
    var uniqueNames = [];
    for(i = 0; i< rows.length; i++){
        if(uniqueNames.indexOf(rows[i]["FromAccount"]) === -1){
            uniqueNames.push(rows[i]["FromAccount"]);
        }
    }
    setupOutput(uniqueNames, rows, ".json")
}

function listAllXML (result){
    try{
        var base = result["TransactionList"]["SupportTransaction"];
        for(var i=0;i<base.length;i++){
            console.log("Date: "+startDate.clone().add(base[i]["$"]["Date"], "day").format("L")
                +" || From: "+base[i]["Parties"][0]["From"][0]
                +" || To: "+base[i]["Parties"][0]["To"][0]
                +" || Amount: £"+base[i]["Value"])
        }
    }
    catch (e) {
        logger.error("They seem to have entered an incorrect file name")
        console.log("Ah theres soemthing amiss! (You probably entered a file name that doesnt exist)")
        return
    }
}

function setupOutput(output, rows, fileType){
    var debtTracker    = []

    for(i=0;i<output.length;i++){
        debtTracker.push ({
            "Name" : output[i],
            "Owe" : 0,
            "Owed" : 0
        })
    }
    var from;
    var to;

    if (fileType == ".csv"){
        from = "From";
        to = "To";
    }
    else if (fileType == ".json"){
        from = "ToAccount";
        to = "ToAccount";
    }

    outputCosts(output, rows, fileType, debtTracker, from, to)
}

function outputCosts(output, rows, fileType, finalCosts, from, to){

    for(i=0;i<rows.length;i++){
        for(j=0;j<finalCosts.length;j++){
            if (rows[i][from] === finalCosts[j]["Name"]){
                if (isNaN(rows[i]["Amount"])) {
                    logger.error("Non numerical data spotted!")
                }
                else{
                    finalCosts[j]["Owe"] += parseFloat(rows[i]["Amount"])
                }
            }
            if (rows[i][to] === finalCosts[j]["Name"]){
                if (isNaN(rows[i]["Amount"])) {
                    logger.error("Non numerical data spotted!")
                }
                else{
                    finalCosts[j]["Owed"] += parseFloat(rows[i]["Amount"])
                }
            }
        }
    }

    //rounding to 2 dp
    for(i=0;i<finalCosts.length;i++){
        finalCosts[i]["Owe"] = finalCosts[i]["Owe"].toFixed(2)
        finalCosts[i]["Owed"] = finalCosts[i]["Owed"].toFixed(2)
    }

    console.log(finalCosts)
}

//Function for one name
function listNameCSV(path, name){
    var isName = false;

    try {
        fs.readFile(path, function (err, fileData) {
            parse(fileData, {columns: true, trim: true}, function(err, rows) {
                for(i=0;i<rows.length;i++){
                    if (rows[i]["From"].toLowerCase() == name || rows[i]["To"].toLowerCase() == name){
                        isName = true;
                        console.log(rows[i])
                    }
                }

                if (!isName){
                    console.log("Sorry this name didnt return any results")
                }
            })
        })
    }
    catch (e){
        logger.error("They seem to have entered an incorrect file name")
        console.log("woops a mistake has occured")
    }
}

function listNameJSON(path, name){
    var isName = false;

    try{
        var obj = require("./"+path);
    }
    catch (e){
        logger.error("They seem to have entered an incorrect file name")
        console.log("Ya goofed up")
        return
    }
    for(i=0;i<obj.length;i++){
        if (obj[i]["FromAccount"].toLowerCase() == name || obj[i]["ToAccount"].toLowerCase() == name){
            isName = true;
            console.log(obj[i])
        }
    }
    if (!isName){
        console.log("Sorry this name didnt return any results")
    }
}

function listNameXML(path, name){
    var isName = false;
    try{
        fs.readFile("./"+path, function(err, data) {
            parser.parseString(data, function (err, result) {
                var base = result["TransactionList"]["SupportTransaction"];
                for(var i=0;i<base.length;i++){
                    if (base[i]["Parties"][0]["From"][0].toLowerCase() == name ||
                        base[i]["Parties"][0]["To"][0].toLowerCase() == name){
                        isName = true;
                        //date is days from 1st jan 1900
                        console.log("Date: "+startDate.clone().add(base[i]["$"]["Date"], "day").format("L")
                            +" || From: "+base[i]["Parties"][0]["From"][0]
                            +" || To: "+base[i]["Parties"][0]["To"][0]
                            +" || Amount: £"+base[i]["Value"]
                            +" || Description: "+base[i]["Description"])
                    }
                }
                if (!isName){
                    logger.error("They seem to have entered a name that wasnt in the database")
                    console.log("Sorry this name didnt return any results")
                }
            });
        });
    }
    catch(e){
        logger.error("They seem to have entered an incorrect file name")
        console.log("Mistakes were made")
        return
    }
}