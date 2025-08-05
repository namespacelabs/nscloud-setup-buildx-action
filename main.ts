import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs";
import {
  nscRemoteBuilderName,
  nscDebugFolder,
  nscVmIdKey,
  nscInRunnerBuilderName,
} from "./common";

async function run(): Promise<void> {
  const commandExists = require("command-exists");

  commandExists("nsc")
    .then(prepareBuildx)
    .catch(() => {
      core.setFailed(`Namespace Cloud CLI not found.

Please add a step this step to your workflow's job definition:

- uses: namespacelabs/nscloud-setup@v0`);
    });
}

async function prepareBuildx(): Promise<void> {
  try {
    const exists = await core.group(
      "Check if Namespace Builder proxy is already configured",
      async (): Promise<boolean> => {
        const remoteBuilderConfigured = await nscBuilderStatus();
        if (remoteBuilderConfigured) {
          core.info(
            "GitHub runner is already configured to use Namespace Cloud build cluster (source: nsc)."
          );
          return true;
        }

        const remoteBuilderExists = await nscBuilderExists(
          nscRemoteBuilderName
        );
        if (remoteBuilderExists) {
          core.info(
            "GitHub runner is already configured to use Namespace Cloud build cluster (source: buildx)."
          );
          return true;
        }

        const inRunnerBuilderExists = await nscBuilderExists(
          nscInRunnerBuilderName
        );
        if (inRunnerBuilderExists) {
          core.info(
            "GitHub runner is already configured to use Namespace Locally cached builder."
          );
          return true;
        }

        core.info("Namespace Builder is not yet configured.");
        return false;
      }
    );

    if (!exists) {
      await core.group("Proxy Buildkit from Namespace Cloud", async () => {
        await ensureNscloudToken();

        const loadToDockerFlag = parseInputLoadToDocker()
          ? "--default_load"
          : "";
        const nscRunner = await isNscRunner();
        if (nscRunner) {
          core.debug("Environment is Namespace Runner");
          await exec.exec(
            `nsc docker buildx setup --name=${nscRemoteBuilderName} --background --use ${loadToDockerFlag} --background_debug_dir=${nscDebugFolder}`
          );
        } else {
          core.debug("Environment is not Namespace Runner");
          await exec.exec(
            `nsc docker buildx setup --name=${nscRemoteBuilderName} --background --use ${loadToDockerFlag}`
          );
        }
      });
    }

    await core.group("Builder", async () => {
      core.info(nscRemoteBuilderName);
    });

    // New line to separate from groups.
    core.info(`
Configured buildx to use remote Namespace Cloud build cluster.`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

function parseInputLoadToDocker(): boolean {
  const loadToDockerString = (
    core.getInput("load-to-docker") || ""
  ).toUpperCase();

  core.debug(`load-to-docker = ${loadToDockerString}`);

  if (loadToDockerString === "TRUE") {
    return true;
  }
  return false;
}

async function ensureNscloudToken() {
  const tokenFile = "/var/run/nsc/token.json";
  if (fs.existsSync(tokenFile)) {
    core.exportVariable("NSC_TOKEN_FILE", tokenFile);
    return;
  }

  // We only need a valid token when opening the proxy
  await exec.exec("nsc auth exchange-github-token --ensure=5m");
}

async function nscBuilderStatus(): Promise<boolean> {
  const { stdout } = await exec.getExecOutput(
    `nsc docker buildx status --output=json`,
    null,
    { ignoreReturnCode: true }
  );

  try {
    const parsed = JSON.parse(stdout);
    if (!parsed || !Array.isArray(parsed)) {
      return false;
    }

    const elems = <Array<any>>parsed;
    for (const elem of elems) {
      if (!elem.hasOwnProperty("Status")) {
        continue;
      }

      const status = elem["Status"];
      if (
        status == "Starting" ||
        status == "Running" ||
        status == "ServerSideProxy"
      ) {
        return true;
      }
    }
  } catch (error) {
    core.warning(error.message);
  }

  return false;
}

async function nscBuilderExists(builderName: string): Promise<boolean> {
  const { stdout, stderr } = await exec.getExecOutput(
    `docker buildx inspect ${builderName}`,
    null,
    { ignoreReturnCode: true }
  );
  const builderNotFoundStr = `no builder "${builderName}" found`;
  return !(
    stdout.includes(builderNotFoundStr) || stderr.includes(builderNotFoundStr)
  );
}

async function isNscRunner(): Promise<boolean> {
  const vmID: string = process.env[`${nscVmIdKey}`] || "";
  return vmID !== "";
}

run();
