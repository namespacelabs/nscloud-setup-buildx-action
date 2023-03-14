import * as path from "path";
import * as fs from "fs";

export const SessionId = "NscBuildkitProxySession";

export function tmpFile(file: string): string {
	const tmpDir = path.join(process.env.RUNNER_TEMP, "ns");

	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir);
	}

	return path.join(tmpDir, file);
}
