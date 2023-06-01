import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { nscRemoteBuilderName } from "./common";

async function run(): Promise<void> {
  try {
    await exec.exec(
      `nsc docker buildx cleanup --name=${nscRemoteBuilderName}`
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
