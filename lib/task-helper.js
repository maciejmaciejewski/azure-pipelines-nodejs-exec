"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const hat = require("hat");
const path_1 = require("path");
const fs_1 = require("fs");
class TaskHelper {
    constructor() {
        // Get values from VSTS input
        this.cwd = tl.getPathInput('cwd', true);
        this.dependencies = tl.getInput('dependencies', false);
        this.script = tl.getInput('script', true);
        // Generate random package name
        this.npmPackageName = hat();
        this.npmPackagePath = path_1.resolve(path_1.join(this.cwd, this.npmPackageName));
        tl.debug(`Package Id = ${this.npmPackageName}`);
        tl.debug(`Package path = ${this.npmPackagePath}`);
    }
    initializeTool(toolName) {
        try {
            let tool = tl.tool(tl.which(toolName.toLowerCase(), true));
            return tool;
        }
        catch (error) {
            tl.error(`Failed to install ${toolName} tool which is mandatory to run this task.`);
            throw Error(`Missing ${toolName} tool`);
        }
    }
    prepareNPMPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dependencies) {
                // make directory for package
                const packageJsonPath = path_1.resolve(path_1.join(this.npmPackagePath, "package.json"));
                tl.debug('Making package directory');
                fs_1.mkdirSync(this.npmPackagePath);
                // parse dependencies and generate package.json file and save it
                tl.debug('Generating package.json file');
                let packageJson = require('./package-template');
                packageJson.name = this.npmPackageName;
                packageJson.dependencies = JSON.parse(this.dependencies);
                fs_1.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                yield this.installDependencies();
            }
            else {
                tl.debug('No dependences detected');
            }
        });
    }
    getDefaultExecOptions() {
        let execOptions = {};
        execOptions.cwd = this.npmPackageName;
        execOptions.failOnStdErr = false;
        execOptions.ignoreReturnCode = false;
        return execOptions;
    }
    installDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            tl.debug('Initializing NPM tool');
            this.npmTool = this.initializeTool('npm');
            this.npmTool.arg('install');
            let execOptions = this.getDefaultExecOptions();
            tl.debug('Running install command');
            yield this.npmTool.exec(execOptions);
            tl.debug('Finished installing dependencies');
        });
    }
    prepareScriptFile() {
        // Check syntactic validity of passed script
        const check = require('syntax-error');
        const scriptPath = path_1.resolve(path_1.join(this.npmPackagePath, 'index.js'));
        let checkResult = check(this.script, scriptPath);
        if (checkResult) {
            tl.error(checkResult.toString());
            throw new Error('Unable to parse script');
        }
        else {
            // Write is as index.js
            tl.debug(`Script contains valid NodeJS code, saving it as ${scriptPath}`);
            fs_1.writeFileSync(scriptPath, this.script);
        }
    }
    runNode() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prepareNPMPackage();
            this.prepareScriptFile();
            this.nodeTool = this.initializeTool('node');
            this.nodeTool.arg(path_1.resolve(path_1.join(this.npmPackagePath, 'index.js')));
            let execAsyncOptions = this.getDefaultExecOptions();
            tl.debug('Running script');
            yield this.nodeTool.exec(execAsyncOptions);
            tl.debug('Finished NodeJs script');
        });
    }
}
exports.TaskHelper = TaskHelper;
//# sourceMappingURL=task-helper.js.map