// websocket server that dashboard connects to.
const redis = require('redis');
const got = require('got');
const fs = require('fs');
const path = require('path');
var request = require('request');
var mwu1 = require('../mannwhitneyu.js');
var mwu = require('mann-whitney-utest');

const configuration = require('../../local-env.json');
const { post } = require('request');
const blue = configuration.blue;
const green = configuration.green;

var blueMetrics = {"memLoad":[],"cpuLoad":[],"status":[],"latency":[]}
var greenMetrics = {"memLoad":[],"cpuLoad":[],"status":[],"latency":[]}
var metricsSummary = {}

let blue_url = `http://${blue.ip}:3000/preview`;
let green_url = `http://${green.ip}:3000/preview`;

let TARGET = blue_url;
var time = 0;

/// Servers data being monitored.
var servers = 
[
    {name: blue.name, url: `http://${blue.ip}:3000/`, status: "#cccccc",  scoreTrend : [0]},
    {name: green.name, url: `http://${green.ip}:3000/`, status: "#cccccc",  scoreTrend : [0]},
];



function start(app)
{
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
				server.memoryLoad = payload.memoryLoad;
				server.cputest = payload.cpuLoad;
				updateHealth(server);
				if(time == 120000){
					console.log("Metrics collected from blue and green VMs");
					client.quit();
					analysisSummary();
				}
			}
		}
	});
	console.log("Generating traffic to blue instance");
		  
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
					// TASK 2
					captureServer.statusCode = res.statusCode;
					captureServer.latency = res.timings.end - now;
				}).catch( e => 
				{
					// console.log(e);
					captureServer.statusCode = e.code;
					captureServer.latency = 5000;
				});
			}
		}
	}, 1000);

	var traffic = setInterval( function (){
		time += 1000;
		try {
			got.post(TARGET, {json: {
				"markdown":"\n{NumberQuestions:true}\n-----------\nStart with header for global options:\n\n    {NumberQuestions:true}\n    -----------\n\n### Multiple Choice Question (Check all that apply)\n\nA *description* for question.  \nQuestions are created with headers (level 3) `### Multiple Choice Question (Check all that apply)`.\n\n* Choice A\n* Choice B\n* Choice C\n\n### Single Choice Question\n\nMarkdown is great for including questions about code snippets:\n```\n$(document).ready( function()\n{\n    ko.applyBindings(new TaskViewModel());\n\tvar converter = new Markdown.Converter();\n\tdocument.write(converter.makeHtml(\"**I am bold**\"));\n});\n```\n\n1. Choice\n2. Choice\n3. Choice\n\n### Ranking/Rating Table\n\nThe first column has the description.  [Use github flavored markdown for table formatting](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables).\n\n|                       | Do not Want | Sometimes | Always |\n| --------------------- | ----------- | --------- | ------ | \n| Search terms used in IDE\t                      |  |  |  |\n| Code that did not work out and was deleted.     |  |  |  |\n| Time spent on particular edits\t              |  |  |  |\n| Code and files viewed\t                          |  |  |  |\n"
			}, timeout: 5000, throwHttpErrors: false}).then(function(res) {
				if (res.statusCode == 200) {
					if(TARGET == blue_url){
						blueMetrics.status.push(0);
					}else{
						greenMetrics.status.push(0);
					}
				}else{
					//console.log(`Bad response status code: ${res.statusCode}`);
					if(TARGET == blue_url){
						blueMetrics.status.push(1);
					}else{
						greenMetrics.status.push(1);
					}
				}
			});		
		} catch(error){
			console.log(`Status check failed: ${error}`);
		}
		
		if(time == 60000){
		  console.log("Redirecting traffic to green instance");
		  TARGET = green_url;
		}
  
		if(time == 120000){
			console.log("Routing completed");
			clearInterval(traffic);
			clearInterval(latency);
		}
	}, 1000);
}

function updateHealth(server)
{
	if(server.name == 'blue'){
		blueMetrics.memLoad.push(server.memoryLoad);
		blueMetrics.cpuLoad.push(server.cpuLoad);
		blueMetrics.latency.push(server.latency);

	}else if(server.name == 'green'){
		greenMetrics.memLoad.push(server.memoryLoad);
		greenMetrics.cpuLoad.push(server.cpuLoad);
		greenMetrics.latency.push(server.latency);
	}
}


function analysisSummary(){
	
	console.log(`Starting analysis...`);

	var score = 0;

	blueMetrics["latency"] = blueMetrics["latency"].filter(x => x != undefined);
	greenMetrics["latency"] = greenMetrics["latency"].filter(x => x != undefined);

	var memLoadRecords = [ blueMetrics["memLoad"], greenMetrics["memLoad"] ];
	var t = mwu1.test(blueMetrics["memLoad"], greenMetrics["memLoad"], alternative = 'less');
	var utest = mwu.test(memLoadRecords);
	
	if(mwu.significant(utest, memLoadRecords)){
		metricsSummary["memLoad"] = "FAIL";
	}else {
		metricsSummary["memLoad"] = "PASS";
		score++;
	}



	var cpuLoadRecords = [ blueMetrics["cpuLoad"], greenMetrics["cpuLoad"] ];
	utest = mwu.test(cpuLoadRecords);
	
	if(mwu.significant(utest, cpuLoadRecords)){
		metricsSummary["cpuLoad"] = "FAIL";
	}else {
		metricsSummary["cpuLoad"] = "PASS";
		score++;
	}

	if( Math.abs(getAvg(blueMetrics.status) - getAvg(greenMetrics.status)) > 80){
		metricsSummary["status"] = "FAIL";
	} else {
		metricsSummary["status"] = "PASS";
		score++;
	}

	var latencyRecords = [ blueMetrics["latency"], greenMetrics["latency"] ];
	utest = mwu.test(latencyRecords);
	if(mwu.significant(utest, latencyRecords)){
		metricsSummary["latency"] = "FAIL";
	}else {
		metricsSummary["latency"] = "PASS";
		score++;
	}

	var finalResult = score > 3 ? "PASS" : "FAIL";
	metricsSummary["final"] = finalResult;

	console.log("------------------------------------------------------");
	console.log("              Canary Analysis - Summary");
	console.log("------------------------------------------------------");
	console.log("    METRIC                |\tJUDGEMENT");
	console.log("------------------------------------------------------");
	console.log(`    MEMORY                |\t${metricsSummary["memLoad"]}`);
	console.log(`    CPU                   |\t${metricsSummary["cpuLoad"]}`);
	console.log(`    STATUS                |\t${metricsSummary["status"]}`);
	console.log(`    LATENCY               |\t${metricsSummary["latency"]}`);
	

	console.log("------------------------------------------------------");
	if(metricsSummary["final"] == "PASS"){
		console.log(`    CANARY ANALYSIS       |\t${metricsSummary["final"]}`)
		console.log('\n    Since all the metrics have passed');
	} else {
		console.log(`    CANARY ANALYSIS       |\t${metricsSummary["final"]}`)
		console.log('\n    Since some of the metrics failed');
	}
	console.log("------------------------------------------------------");
}

function getAvg(numbers) {
	const total = numbers.reduce((sum, num) => sum + num, 0);
	return (total / numbers.length) * 100;
}
  

module.exports.start = start;