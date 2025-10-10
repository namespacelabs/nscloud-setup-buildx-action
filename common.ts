import * as core from "@actions/core";

export const nscRemoteBuilderName = "nsc-remote";
export const nscInRunnerBuilderName = "in-runner-builder";
export const nscDebugFolder = "/home/runner/nsc";
export const nscVmIdKey = "NSC_VM_ID";

export function getBuilderName(): string {
  const customName = core.getInput("builder-name");
  if (customName !== "") {
    return customName;
  }

  return nscRemoteBuilderName;
}
