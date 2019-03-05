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
const NpmHelper = require('./lib/task-helper').TaskHelper;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let helper = new NpmHelper();
            yield helper.runNode();
        }
        catch (err) {
            console.log(err);
            tl.setResult(tl.TaskResult.Failed, err);
        }
    });
}
run();
//# sourceMappingURL=index.js.map