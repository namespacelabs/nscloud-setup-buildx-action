import * as path from "path";
import * as fs from "fs";

export const ProxyPidFile = tmpFile("buildkit-proxy.pid");
export const ProxyArmPidFile = tmpFile("buildkit-proxy-arm.pid");

export function tmpFile(file: string): string {
	const tmpDir = path.join(process.env.RUNNER_TEMP, "ns");

	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir);
	}

	return path.join(tmpDir, file);
}
