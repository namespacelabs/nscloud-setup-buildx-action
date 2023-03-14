# Create a Namespace Cloud cluster

This repository hosts a GitHub action that configures buildx to use a
[Namespace Cloud](https://cloud.namespace.so) build cluster.

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
      - name: Install and configure Namespace Cloud CLI
        uses: namespacelabs/nscloud-setup@v0.0.2
      - name: Configure buildx
        uses: namespacelabs/nscloud-setup-buildx-action@v0.0.1
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
