# Integration Map

How components connect and what data flows between them.

### Erc721-stylus --> Frontend-scaffold

- **Source**: Erc721-stylus (`3e5e841e`)
  - Output ports: NFT Contract (contract)
- **Target**: Frontend-scaffold (`5b9f8438`)
  - Input ports: Contract ABI (contract), Network Config (config)

### Frontend-scaffold --> Wallet-auth

- **Source**: Frontend-scaffold (`5b9f8438`)
  - Output ports: App Context (config)
- **Target**: Wallet-auth (`a7e0ba36`)
  
