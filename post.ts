import * as exec from "@actions/exec";
import { SessionId } from "./common";

async function run(): Promise<void> {
	// send CTRL + C
	await exec.exec(`tmux send-keys -t ${SessionId} C-c`);
}

run();
