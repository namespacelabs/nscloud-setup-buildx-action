import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { ProxyPidFile, tmpFile } from "./common";

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
	try {
		const sock = tmpFile("buildkit-proxy.sock");

		await core.group(`Proxy Buildkit from Namespace Cloud`, async () => {
			await exec.exec(
				`nsc cluster proxy --kind=buildkit --cluster=build-cluster --sock_path=${sock} --background=${ProxyPidFile}`
			);

			await exec.exec(
				`docker buildx create --name remote-nsc --driver remote unix://${sock} --use`
			);
		});

		console.log(`Configured buildx to use remote Namespace Cloud build cluster.`);

		await core.group(`Builder`, async () => {
			core.info("remote-nsc");
		});
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
