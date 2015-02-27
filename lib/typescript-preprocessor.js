'use strict';
var path = require('path');
var Writer = require('broccoli-writer');
var ts = require('typescript');
var walkSync = require('walk-sync');
var objectAssign = require('object-assign');

function TSCompiler(inputTree, options) {
    if (!(this instanceof TSCompiler)) {
        return new TSCompiler(inputTree, options);
    }

    this.inputTree = inputTree;
    this.options = options || {};
}

TSCompiler.prototype = Object.create(Writer.prototype);
TSCompiler.prototype.constructor = TSCompiler;

TSCompiler.prototype.write = function (readTree, destDir) {

    function compile(filenames, options, err) {
        var host = ts.createCompilerHost(options);
        var program = ts.createProgram(filenames, options, host);
        var checker = ts.createTypeChecker(program, /*produceDiagnostics*/ true);
        var result = checker.emitFiles();

        var allDiagnostics = program.getDiagnostics()
            .concat(checker.getDiagnostics())
            .concat(result.diagnostics);

        allDiagnostics.forEach(function(diagnostic) {
            var lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
            console.error(diagnostic.file.filename + ' ' + lineChar.line + ',' + lineChar.character + '): ' + diagnostic.messageText); 
        });

        if (allDiagnostics.length != 0)
            throw new String();
    }

    var options = objectAssign({ outDir: destDir }, this.options);
    if (this.options.outDir) {
        options.outDir = path.resolve(destDir, options.outDir);
    }
    if (options.out) {
        options.out = path.resolve(destDir, options.out);
    }

    return readTree(this.inputTree).then(function (srcDir) {
        var files = walkSync(srcDir)
        .filter(isTypeScript)
        .map(function (filepath) {
            return path.resolve(srcDir, filepath);
        });

        if (files.length > 0) {

            compile(files, options);
        }
    });
};

function isTypeScript(filepath) {
    return path.extname(filepath).toLowerCase() === '.ts';
}


function TypeScriptPreprocessor(options) {
  this.name = 'ember-cli-typescript';
  this.ext = 'ts';
  this.options = options || {};
}

TypeScriptPreprocessor.prototype.toTree = function(tree, inputPath, outputPath) {

    var options = {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.AMD,
        outDir: outputPath
    };

    return TSCompiler(tree, options);
};

module.exports = TypeScriptPreprocessor;







