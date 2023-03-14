import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { SessionId } from "./common";

async function run(): Promise<void> {
	try {
		// send CTRL + C
		await exec.exec(`tmux send-keys -t ${SessionId} C-c`);
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
