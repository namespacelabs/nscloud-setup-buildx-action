import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import { nscRemoteBuilderName } from "./common";

async function run(): Promise<void> {
  var commandExists = require("command-exists");

  commandExists("nsc")
    .then(prepareBuildx)
    .catch(function () {
      core.setFailed(`Namespace Cloud CLI not found.

Please add a step this step to your workflow's job definition:

- uses: namespacelabs/nscloud-setup@v0`);
    });
}

async function prepareBuildx(): Promise<void> {
  try {
    const exists = await core.group(
      `Ensure Namespace Builder proxy is already configured`,
      async (): Promise<boolean> => {
        const builderExists = await remoteNscBuilderExists();
        if (builderExists) {
          core.info(
            `GitHub runner is already configured to use Namespace Cloud build cluster.`
          );
          return true;
        }
        core.info(`Namespace Builder is not yet configured.`);
        return false;
      }
    );

    if (!exists) {
      await core.group(`Proxy Buildkit from Namespace Cloud`, async () => {
        await ensureNscloudToken();

        await exec.exec(
          `nsc buildkit buildx setup --name=${nscRemoteBuilderName} --background --use`
        );
      });
    }

    await core.group(`Builder`, async () => {
      core.info(nscRemoteBuilderName);
    });

    // New line to separate from groups.
    core.info(`
Configured buildx to use remote Namespace Cloud build cluster.`);
  } catch (error) {
    core.setFailed(error.message);
  }
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

async function remoteNscBuilderExists(): Promise<boolean> {
  const { stdout, stderr } = await exec.getExecOutput(
    `docker buildx inspect ${nscRemoteBuilderName}`,
    null,
    { ignoreReturnCode: true, silent: true }
  );
  const builderNotFoundStr = `no builder "${nscRemoteBuilderName}" found`;
  return !(
    stdout.includes(builderNotFoundStr) || stderr.includes(builderNotFoundStr)
  );
}

run();
