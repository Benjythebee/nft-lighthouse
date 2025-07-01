# nft-lighthouse

The BunJS server behind Cyberbroker's paradigm-found NFT ownership system. Runs a small server that listens for chain events and records ownership over time. It then provides an API to let other microservices get information about a wallet's owned NFTs

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.0.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
