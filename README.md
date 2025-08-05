# Access to Namespace Remote Builders

This repository hosts a GitHub action that configures buildx to use a
[Namespace Cloud](https://cloud.namespace.so) build cluster.

**Note:** Workflows using [Namespace-managed GitHub Runners](https://namespace.so/docs/solutions/github-actions) can skip `nscloud-setup-buildx-action`. Check out the [migration guide](https://namespace.so/docs/solutions/github-actions/migration#faster-docker-builds) for more details.

## Example

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    # These permissions are needed to interact with GitHub's OIDC Token endpoint.
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Configure access to Namespace
        uses: namespacelabs/nscloud-setup@v0
      - name: Configure buildx
        uses: namespacelabs/nscloud-setup-buildx-action@v0
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: user/app:latest
```

## Requirements

This action uses `nsc`, the Namespace Cloud CLI.
You can add it to your workflow using [namespacelabs/nscloud-setup](https://github.com/namespacelabs/nscloud-setup)
(see [example](#example)).
