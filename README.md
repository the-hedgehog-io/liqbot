# `Hedgehog Protocal Liquidator Bot`

A liquidation bot for Hedgehog Protocol.


## Prerequisites

- Node v18 or newer
- Yarn v4.3.x

## Supported chains

- Sepolia: This bot currently supports liquidation operations on the Sepolia test network.

## Installation

To set up the liquidator bot, follow these steps:

1.	Clone the repository to your machine:

`git clone https://github.com/your-repo/liquidator-bot.git`

2. Install the necessary dependencies:

`yarn install`

3. Build the project:

`yarn build`

## Configuration

To configure the Hedgehog liquidation bot, you need to create a `.env` file in the root directory of the project. This file will hold the environment variables necessary for the bot’s operation.

1.	Use the .env.example file as a template. Copy it to create your own .env file:

`cp .env.example .env`

2. Open the .env file and configure the following required variables:
- PRIVATE_KEY: The private key of the wallet that will be used to send transactions. Ensure this key is kept secure.
- RPC_URL: The RPC URL (without protocol) of the blockchain node you intend to connect to. This should point to a node on the Sepolia network or another supported network.
RPC should support WSS.

```text
PRIVATE_KEY=your_private_key_here
RPC_URL=sepolia.infura.io/v3/your_project_id
```

Replace your_private_key_here and your_project_id with your actual private key and RPC URL, respectively.

## Running

Once the configuration is complete, you can start the liquidation bot by running:

`yarn start`


It will keep running and logging liquidation attempts until the process is killed.

## License

This project is licensed under the MIT License.