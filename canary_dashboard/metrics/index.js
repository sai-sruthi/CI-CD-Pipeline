// websocket server that dashboard connects to.
const redis = require('redis');
const got = require('got');
const fs = require('fs');
const path = require('path');
const configuration = require('../../local-env.json');
var request = require('request');
var mwu = require('mann-whitney-utest');



const BLUE = configuration.blue.ip;
const GREEN = configuration.green.ip;

const BLUE_ENDPOINT  = BLUE+'/preview';
const GREEN_ENDPOINT = GREEN+'/preview';


let TARGET = BLUE_ENDPOINT;

var analysis;
var time = 0;

var blueStats = {
	"memory": [],
	"cpu": [],
	"latency": [],
	"status": []
}

var greenStats = {
	"memory": [],
	"cpu": [],
	"latency": [],
	"status": []
}

var finalAnalysis = {}

/// Servers data being monitored.
var servers = 
[
	{name: "blue-srv",url:`http://${BLUE}:3000/`, status: "#cccccc",  scoreTrend : [0]},
	{name: "green-srv",url:`http://${GREEN}:3000/`, status: "#cccccc",  scoreTrend : [0]},
];

async function start(app)
{
	console.log("\n\n----------------------------------------------------------------------------------");
	console.log("|                               CANARY ANALYSIS                                  |");
	console.log("----------------------------------------------------------------------------------\n\n");

	console.log("\t(1) Spawning stress to Blue and Green servers.");
	/////////////////////////////////////////////////////////////////////////////////////////
	// REDIS SUBSCRIPTION
	/////////////////////////////////////////////////////////////////////////////////////////
	let client = redis.createClient(6379, 'localhost', {});
	// We subscribe to all the data being published by the server's metric agent.
	for( var server of servers )
	{
		// The name of the server is the name of the channel to recent published events on redis.
		client.subscribe(server.name);
	}

	// When an agent has published information to a channel, we will receive notification here.
	client.on("message", function (channel, message) 
	{
		//console.log(`Received message from agent: ${channel}`)
		for( var server of servers )
		{

			// Update our current snapshot for a server's metrics.
			if( server.name == channel)
			{
				let payload = JSON.parse(message);
				//console.log(`Received payload: ${message}`);
				server.memoryLoad = payload.memoryLoad;
				server.cpu = payload.cpu;
				updateHealth(server, client);
			}
		}
	});

	// LATENCY CHECK
	var latency = setInterval( function () 
	{
		for( var server of servers )
		{
			if( server.url )
			{
				let now = Date.now();

				// Bind a new variable in order to for it to be properly captured inside closure.
				let captureServer = server;

				// Make request to server we are monitoring.
				got(server.url, {timeout: 5000, throwHttpErrors: false}).then(function(res)
				{
					captureServer.statusCode = res.statusCode;
					captureServer.latency = res.timings.end - now ;
				}).catch( e => 
				{
					console.log(`Latency Error : ${e}`);
					captureServer.statusCode = e.code;
					captureServer.latency = 5000;
				});
			}
		}
		// time += 5000;
	}, 1000);

	analysis = setInterval( function (){
		
		var serverName = TARGET == BLUE_ENDPOINT ? "blue" : "green" 
		try 
		{
			//console.log(`Sending traffic to ${serverName} server, ip: ${TARGET} `);
  
		  var options = {
			  uri: TARGET,
			  method: 'POST',
			  json:{
				"markdown":"\n{NumberQuestions:true}\n-----------\nStart with header for global options:\n\n    {NumberQuestions:true}\n    -----------\n\n### Multiple Choice Question (Check all that apply)\n\nA *description* for question.  \nQuestions are created with headers (level 3) `### Multiple Choice Question (Check all that apply)`.\n\n* Choice A\n* Choice B\n* Choice C\n\n### Single Choice Question\n\nMarkdown is great for including questions about code snippets:\n```\n$(document).ready( function()\n{\n    ko.applyBindings(new TaskViewModel());\n\tvar converter = new Markdown.Converter();\n\tdocument.write(converter.makeHtml(\"**I am bold**\"));\n});\n```\n\n1. Choice\n2. Choice\n3. Choice\n\n### Ranking/Rating Table\n\nThe first column has the description.  [Use github flavored markdown for table formatting](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables).\n\n|                       | Do not Want | Sometimes | Always |\n| --------------------- | ----------- | --------- | ------ | \n| Search terms used in IDE\t                      |  |  |  |\n| Code that did not work out and was deleted.     |  |  |  |\n| Time spent on particular edits\t              |  |  |  |\n| Code and files viewed\t                          |  |  |  |\n"
			}
  
			};
			
			request(options, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				//console.log(body);
				if(TARGET == BLUE_ENDPOINT){
					blueStats.status.push(0);
				}else{
					greenStats.status.push(0);
				}
			  }else{
				//console.log(`Bad response status code: ${response.statusCode}`);
				if(TARGET == BLUE_ENDPOINT){
					blueStats.status.push(1);
				}else{
					greenStats.status.push(1);
				}
			  }
			});
		}
		catch (error) {
		   console.log(`Error in setInterval(): ${error}`);
		}
  
		time += 1000;
		//console.log(`Current time: ${time}`);
		if(time == 300000){
		  console.log("\t(2) BLUE server 'stressing' complete, switching to GREEN server.");
		  TARGET = GREEN_ENDPOINT;
		}
  
		if(time == 600000){
			console.log("\t(3) GREEN server 'stressing' complete.\n");
			clearInterval(analysis);
			clearInterval(latency);
		    //console.log("CLEARED");
		}
	}, 1000);
}

function updateHealth(server, client)
{
	//console.log("Updating Health")
	// Update statistics arrays
	if(server.name == 'blue-srv'){
		blueStats.memory.push(server.memoryLoad);
		blueStats.cpu.push(server.cpu);
		blueStats.latency.push(server.latency);

	}else if(server.name == 'green-srv'){
		greenStats.memory.push(server.memoryLoad);
		greenStats.cpu.push(server.cpu);
		greenStats.latency.push(server.latency);
	}

	if(time == 600000){
		console.log("\tNOTE: Testing complete. Taking REDIS client down.\n");
		client.quit();
		canaryAnalysis();
	}
}

function canaryAnalysis(){
	//console.log(blueStats);
	//console.log(greenStats);

	console.log("\t(4) Conducting Canary Analysis on Blue & Green Servers.");

	var pass = 0;

	blueStats["latency"] = blueStats["latency"].filter(x => x != undefined);
	greenStats["latency"] = greenStats["latency"].filter(x => x != undefined);

	var memorySamples = [ blueStats["memory"], greenStats["memory"] ];
	//console.log(memorySamples);
	//console.log(mwu.test(memorySamples));

	if( memorySamples == []){
		console.log("ERROR");
		console.log(memorySamples);
	}
	var u = mwu.test(memorySamples);

	if(mwu.significant(u, memorySamples)){
		finalAnalysis["memory"] = "FAIL | data found to have a significant difference";
	}else {
		finalAnalysis["memory"] = "PASS | data found to be similar";
		pass++;
	}

	var cpuSamples = [ blueStats["cpu"], greenStats["cpu"] ];
	//console.log(cpuSamples);
	//console.log(mwu.test(cpuSamples));

	u = mwu.test(cpuSamples);

	if(mwu.significant(u, cpuSamples)){
		finalAnalysis["cpu"] = "FAIL | data found to have a significant difference";
	}else {
		finalAnalysis["cpu"] = "PASS | data found to be similar";
		pass++;
	}

	var latencySamples = [ blueStats["latency"], greenStats["latency"] ];
	//console.log(latencySamples);
	//console.log(mwu.test(latencySamples));

	u = mwu.test(latencySamples);

	if(mwu.significant(u, latencySamples)){
		finalAnalysis["latency"] = "FAIL | data found to have a significant difference";
	}else {
		finalAnalysis["latency"] = "PASS | data found to be similar";
		pass++;
	}

	if( Math.abs(getAvg(blueStats.status) - getAvg(greenStats.status)) <= 25){
		finalAnalysis["error"] = "PASS | data found to be similar";
		pass++;
	} else {
		finalAnalysis["error"] = "FAIL | data found to have a significant difference";
	}

	// var errorSample = [ [blueStats["errors"]], [greenStats["errors"]]  ];
	// console.log(errorSample);
	// console.log(mwu.test(errorSample));

	// u = mwu.test(errorSample);

	// if(mwu.significant(u, errorSample)){
	// 	finalAnalysis["error"] = "FAIL | data found to have a significant difference";
	// }else {
	// 	finalAnalysis["error"] = "PASS | data found to be similar";
	// 	pass++;
	// }

	var canaryScore = (pass/4)*100;
	finalAnalysis["canaryScore"] = canaryScore;
	var outcome = canaryScore >= 90 ? "PASS" : "FAIL";
	finalAnalysis["overall"] = outcome;
	print_statistics();
}

function print_statistics(){
	console.log("\n\n\t=====================================================================");
	console.log("\t                Canary Analysis - Statistical Report");
	console.log("\t=====================================================================");
	console.log("\n\n\t  METRIC                   |\t\tRESULT");
	console.log("\t---------------------------------------------------------");
	console.log(`\t  MEMORY LOAD              |\t\t${finalAnalysis["memory"]}`);
	console.log(`\t  CPU LOAD                 |\t\t${finalAnalysis["cpu"]}`);
	console.log(`\t  LATENCY                  |\t\t${finalAnalysis["latency"]}`);
	console.log(`\t  ERRORS                   |\t\t${finalAnalysis["error"]}`);

	console.log("\n\n\t---------------------------------------------------------");
	console.log(`\t  OVERALL CANARY SCORE     |\t\t${finalAnalysis["canaryScore"]}`);
	if(finalAnalysis["overall"] == "PASS"){
		console.log(`\t  OVERALL CANARY ANALYSIS  |\t\t${finalAnalysis["overall"]}`)
		console.log('\n\t  Met or exceeded the requirement of 90% similarity');
	} else {
		console.log(`\t  OVERALL CANARY ANALYSIS  |\t\t${finalAnalysis["overall"]}`)
		console.log('\n\t  Did not meet the requirement of 90% similarity');
	}
	console.log("\t---------------------------------------------------------");
}

function getAvg(numbers) {
	const total = numbers.reduce((sum, num) => sum + num, 0);
	return (total / numbers.length) * 100;
}
  


module.exports.start = start;