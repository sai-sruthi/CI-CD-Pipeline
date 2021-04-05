const esprima = require("esprima");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const path = require('path');
const chalk = require('chalk');
const DirectoryAnalysis = require('./directory-analysis');
const Violation = require('./violation');
const fileReader = require('./file-reader')

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		// default value is self if no other script is provided.
		args = ['analysis.js'];
	}
	const directory = args[0];
	const directoryAnalysis = new DirectoryAnalysis();
	console.log(chalk.yellow("Parsing ast and running static analysis..."));
	
	const files = [];
	fileReader.loadFiles(directory, files, '.js');
	console.log(chalk.blue(`Analyzer found ${files.length} JavaScript file(s) to analyze.`));
	files.forEach((file) => {
		const fileAnalysis = {}; // any given file can have n builders i.e function, file, etc so we collect all builders in this object
		console.log(chalk.blue(`Analyzing ${file}...`));
		complexity(file, fileAnalysis);
		directoryAnalysis.fileAnalysis.push(fileAnalysis);
	});

	console.log(chalk.green("Static analysis complete."));
	console.log(chalk.yellow("Printing analysis report\n"))

	// Report
	directoryAnalysis.fileAnalysis.forEach((builders) => {
		for( const node in builders )
		{
			const builder = builders[node];
			builder.reportStatistics();
			builder.reportViolations();
		}
	});

	if(directoryAnalysis.hasViolations()) {
		console.error(chalk.red('Thereshold failures found while analyzing files in directory'))
	}
};

function complexity(filePath, builders)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// Initialize builder for file-level information
	var fileBuilder = new FileBuilder();
	fileBuilder.FileName = filePath;
	builders[filePath] = fileBuilder;

	// Traverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var builder = new FunctionBuilder();

			builder.FunctionName = functionName(node);
			builder.StartLine    = node.loc.start.line;
			// Calculate function level properties.
			// 4. Method Length
			builder.Length = node.loc.end.line - node.loc.start.line;

			// With new visitor(s)...
			traverseWithParents(node, function (child) 
			{
				// peform message chain & max depth calculations here....

			});

			builders[builder.FunctionName] = builder;
		}
	});

}

// Represent a reusable "class" following the Builder pattern.
class FunctionBuilder
{	
	// list of threshold violations
	#violations = [];

	#thresholds = { // thresholds for the different anlysis properties
		Length: [{t: 100, color: 'red'}, {t: 10, color: 'yellow'}],
		MaxNestingDepth: [{t: 5, color: 'red'}],
		MessageChain: [{t: 10, color: 'red'}]
	}


	constructor() {
		this.StartLine = 0;
		this.FunctionName = "";
		// The number of lines.
		this.Length = 0;
		// The max depth of scopes (nested ifs, loops, etc)
		this.MaxNestingDepth    = 0;
		// the number of . accesors
		this.MessageChain = 0;
	}

	#calculateViolations() {
		for(const thresholdConfig in this.#thresholds) {
			const threshold = this.#thresholds[thresholdConfig][0].t;
			const currentValue = this[thresholdConfig]
			if(currentValue > threshold) {
				const violation = new Violation(thresholdConfig, threshold, currentValue);
				this.#violations.push(violation);
			}
		}
	}

	reportStatistics()
	{
		this.#calculateViolations();

		console.log(
			chalk`{blue.underline ${this.FunctionName}}(): at line #${this.StartLine}
Length: ${this.Length}
MessageChain: ${this.MessageChain}
MaxDepth: ${this.MaxNestingDepth}\n`
		);
	}

	reportViolations() {
		this.#violations.forEach((violation) => {
			violation.report();
		});
	}

	// return if the builder has threshold violations
	hasViolations = function() {
		return this.#violations.length > 0;
	}
};

// A builder for storing file level information.
class FileBuilder
{	
	// list of threshold violations
	#violations = [];

	constructor() {
		this.FileName = "";
	}

	reportStatistics = function()
	{
		console.log (
chalk`{magenta.underline ${this.FileName}}`);
	}

	reportViolations = function() {
		this.#violations.forEach((violation) => {
			violation.report();
		});
	}

	// return if the builder has threshold violations
	hasViolations = function() {
		return this.#violations.length > 0;
	}
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

module.exports = main;