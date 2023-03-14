import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { SessionId, tmpFile } from "./common";

async function run(): Promise<void> {
	var commandExists = require("command-exists");

	commandExists("nsc")
		.then(prepareBuildx)
		.catch(function () {
			core.setFailed(`Namespace Cloud CLI not found.

Please add a step this step to your workflow's job definition:

- uses: namespacelabs/nscloud-setup@v0.0.1`);
		});
}

async function prepareBuildx(): Promise<void> {
	const sock = tmpFile("buildkit.sock");
	await exec.exec(`tmux new-session -d -s ${SessionId} "nsc proxy buildkit ${sock}"`);

	await exec.exec(`docker buildx create --name remote-nsc --driver remote unix://${sock}`);

	await exec.exec("docker buildx use remote-nsc");
}

run();
