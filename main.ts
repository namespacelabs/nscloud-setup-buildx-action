import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { ProxyPidFile, ProxyArmPidFile, tmpFile } from "./common";

async function run(): Promise<void> {
	var commandExists = require("command-exists");

	commandExists("nsc")
		.then(prepareBuildx)
		.catch(function () {
			core.setFailed(`Namespace Cloud CLI not found.

Please add a step this step to your workflow's job definition:

- uses: namespacelabs/nscloud-setup@v0.0.3`);
		});
}

async function prepareBuildx(): Promise<void> {
	try {
		const sock = tmpFile("buildkit-proxy.sock");
		const sockArm = tmpFile("buildkit-proxy-arm64.sock");

		await core.group(`Proxy Buildkit from Namespace Cloud`, async () => {
			// We only need a valid token when opening the proxy
			await exec.exec("nsc auth exchange-github-token --ensure=5m");

			const handleAmd = exec.exec(
				`nsc cluster proxy --kind=buildkit --cluster=build-cluster --sock_path=${sock} --background=${ProxyPidFile}`
			);
			const handleArm = exec.exec(
				`nsc cluster proxy --kind=buildkit --cluster=build-cluster-arm64 --sock_path=${sockArm} --background=${ProxyArmPidFile}`
			);
			await handleAmd
			await handleArm
			

			await exec.exec(
				`docker buildx create --name remote-nsc --driver remote unix://${sock} --use`
			);
			await exec.exec(
				`docker buildx create --name remote-nsc --driver remote unix://${sockArm} --append`
			);
		});

		await core.group(`Builder`, async () => {
			core.info("remote-nsc");
		});

		// New line to separate from groups.
		core.info(`
Configured buildx to use remote Namespace Cloud build cluster.`);
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
