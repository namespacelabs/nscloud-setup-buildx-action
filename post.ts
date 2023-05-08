import * as core from "@actions/core";
import * as fs from "fs";
import { ProxyPidFile } from "./common";

async function run(): Promise<void> {
	try {
		if (fs.existsSync(ProxyPidFile)) {
			const pid = fs.readFileSync(ProxyPidFile, "utf8");
			process.kill(parseInt(pid), "SIGINT");
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
