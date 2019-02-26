import * as tl from 'vsts-task-lib/task';

const TaskHelper = require('./lib/task-helper').TaskHelper
async function run() : Promise<void> {
  try {
    let helper = new TaskHelper()
    await helper.runNode()
  } catch (err) {
    console.log(err)
    tl.setResult(tl.TaskResult.Failed, err)
  }
}

run()
