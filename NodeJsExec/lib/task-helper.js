"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskHelper = void 0;
const tl = require("azure-pipelines-task-lib/task");
const hat = require("hat");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const check = require("syntax-error");
class TaskHelper {
    constructor(cwd, dependencies, script) {
        this.cwd = cwd;
        this.dependencies = dependencies;
        this.script = script;
        // Generate random package name
        this.npmPackageName = hat();
        this.npmPackagePath = path_1.resolve(path_1.join(this.cwd, this.npmPackageName));
        tl.debug(`Package Id = ${this.npmPackageName}`);
        tl.debug(`Package path = ${this.npmPackagePath}`);
        tl.debug('Making package directory');
        // Ensure that package dir exists
        fs_extra_1.ensureDirSync(this.npmPackagePath);
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
    getDefaultExecOptions() {
        let execOptions = {};
        execOptions.cwd = this.npmPackagePath,
            execOptions.errStream = process.stdout,
            execOptions.outStream = process.stdout,
            execOptions.failOnStdErr = false;
        execOptions.ignoreReturnCode = false;
        execOptions.windowsVerbatimArguments = true;
        return execOptions;
    }
    prepareNPMPackage() {
        tl.debug('Generating package.json file');
        let packageJson = require('./package-template');
        packageJson.name = this.npmPackageName;
        let packageJsonPath = path_1.join(this.npmPackagePath, 'package.json');
        if (this.dependencies) {
            packageJson.dependencies = JSON.parse(this.dependencies);
        }
        fs_extra_1.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    installDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            tl.debug('Initializing NPM tool');
            this.npmTool = this.initializeTool('npm');
            this.npmTool.arg('install');
            tl.debug('Running install command');
            const exitCode = yield this.npmTool.exec(this.getDefaultExecOptions());
            if (exitCode.exitCode === null) {
                throw (new Error('Script execution cancelled'));
            }
            if (exitCode.code !== 0) {
                throw (new Error('Failed to execute script'));
            }
            tl.debug('Finished installing dependencies');
        });
    }
    prepareScriptFile() {
        // Check syntactic validity of passed script
        const scriptPath = path_1.resolve(path_1.join(this.npmPackagePath, 'index.js'));
        let checkResult = check(this.script, scriptPath);
        if (checkResult) {
            tl.error(checkResult.toString());
            throw new Error('Unable to parse script');
        }
        else {
            tl.debug(`Script contains valid NodeJS code, saving it as ${scriptPath}`);
            fs_extra_1.writeFileSync(scriptPath, this.script);
        }
    }
    runScript() {
        return __awaiter(this, void 0, void 0, function* () {
            tl.debug('Running script');
            let npmTool = this.initializeTool('npm');
            npmTool.arg(['start']);
            const exitCode = yield npmTool.exec(this.getDefaultExecOptions());
            if (exitCode.exitCode === null) {
                throw (new Error('Script execution cancelled'));
            }
            if (exitCode.code !== 0) {
                throw (new Error('Failed to execute script'));
            }
            tl.debug('Finished NodeJs script execution');
        });
    }
    runNode() {
        return __awaiter(this, void 0, void 0, function* () {
            process.on("SIGINT", () => {
                tl.debug('Started cancellation of executing script');
                this.npmTool.killChildProcess();
            });
            this.prepareNPMPackage();
            yield this.installDependencies();
            this.prepareScriptFile();
            yield this.runScript();
        });
    }
}
exports.TaskHelper = TaskHelper;
//# sourceMappingURL=task-helper.js.map