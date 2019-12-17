import * as tl from 'azure-pipelines-task-lib/task'
const TaskHelper = require('./lib/task-helper').TaskHelper

async function run() : Promise<void> {
  let dependencies = tl.getInput('dependencies', false)
  let cwd = tl.getPathInput('cwd', true)
  let script = tl.getInput('script', true)

  try {
    let helper = new TaskHelper(cwd, dependencies, script)
    await helper.runNode()
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err)
  }
}

run()
