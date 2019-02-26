import * as tl from 'vsts-task-lib/task'
import * as hat from 'hat'
import { join, resolve } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import * as tr from 'vsts-task-lib/toolrunner';

export class TaskHelper {
  private npmPackageName: string
  private npmPackagePath: string
  private cwd: string
  private dependencies: string
  private script: string
  private npmTool: tr.ToolRunner
  private nodeTool: tr.ToolRunner

  constructor() {
    // Get values from VSTS input
    this.cwd = tl.getPathInput('cwd', true);
    this.dependencies = tl.getInput('dependencies', false)
    this.script = tl.getInput('script', true)
    // Generate random package name
    this.npmPackageName = hat()
    this.npmPackagePath = resolve(join(this.cwd, this.npmPackageName))
    tl.debug(`Package Id = ${this.npmPackageName}`)
    tl.debug(`Package path = ${this.npmPackagePath}`)
  }

  private initializeTool(toolName: string): tr.ToolRunner {
    try {
      let tool = tl.tool(tl.which(toolName.toLowerCase(), true))
      return tool
    } catch (error) {
      tl.error(`Failed to install ${toolName} tool which is mandatory to run this task.`)
      throw Error(`Missing ${toolName} tool`)
    }
  }

  private async prepareNPMPackage(): Promise<void> {
      if (this.dependencies) {
        // make directory for package
        const packageJsonPath = resolve(join(this.npmPackagePath, "package.json"))
        tl.debug('Making package directory')
        mkdirSync(this.npmPackagePath)

        // parse dependencies and generate package.json file and save it
        tl.debug('Generating package.json file')
        let packageJson = require('./package-template')
        packageJson.name = this.npmPackageName
        packageJson.dependencies = JSON.parse(this.dependencies)
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

        await this.installDependencies()
      } else {
        tl.debug('No dependences detected')
      }
  }

  private getDefaultExecOptions(): tr.IExecOptions  {
    let execOptions = <tr.IExecOptions>{}
    execOptions.cwd = this.npmPackageName
    execOptions.failOnStdErr = false
    execOptions.ignoreReturnCode = false
    return execOptions
  }

  private async installDependencies(): Promise<void> {
    tl.debug('Initializing NPM tool')
    this.npmTool = this.initializeTool('npm')
    this.npmTool.arg('install')

    let execOptions = this.getDefaultExecOptions()

    tl.debug('Running install command')
    await this.npmTool.exec(execOptions)
    tl.debug('Finished installing dependencies')
  }

  prepareScriptFile(): void {
    // Check syntactic validity of passed script
    const check = require('syntax-error')
    const scriptPath = resolve(join(this.npmPackagePath, 'index.js'))
    let checkResult = check(this.script, scriptPath)

    if (checkResult) {
      tl.error(checkResult.toString())
      throw new Error('Unable to parse script')
    } else {
      // Write is as index.js
      tl.debug(`Script contains valid NodeJS code, saving it as ${scriptPath}`)
      writeFileSync(scriptPath, this.script)
    }
  }

  async runNode(): Promise<void> {
    await this.prepareNPMPackage()
    this.prepareScriptFile()

    this.nodeTool = this.initializeTool('node')
    this.nodeTool.arg(resolve(join(this.npmPackagePath, 'index.js')))

    let execAsyncOptions = this.getDefaultExecOptions()

    tl.debug('Running script')
    await this.nodeTool.exec(execAsyncOptions)

    tl.debug('Finished NodeJs script')
  }
}
