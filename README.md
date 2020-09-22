# Koinos Mining

## Key Management

Koinos is using a memory hard proof of work for the initial distribution of the Koinos core token (KOIN). This mining takes place via smart contracts on Ethereum. To mine, you'll need some Ether and a couple of Ethereum addresses.

We recommend using two Etherum addresses. One of them will be generated in the miner itself, and the other is created via another Ethereum wallet such as Metamask or MyEtherWallet.

Your Metamask address will be used as the destination for you KOIN as well as an intermediary account to fund your mining. Metamask has considerable [documention](https://metamask.zendesk.com/hc/en-us/articles/360028141672-How-to-send-deposit-tokens-to-your-MetaMask-Wallet) on how to use their software.

When you start the Koinos miner, click the `Keys` button in the top bar. This will open a dialogue to generate a key in the miner. You will want to write down the 12 word recovery phrase to prevent loss of access to the account. You can use the same 12 word recovery phrase to recover this address in Metamask.

Copy your address from Metamask and paste it in the address field on the main miner window.

With this configuration, you will pay for proofs with the account generated in the miner and send tokens directly to the account controlled by Metamask. Your KOIN will be controlled by a more secure key and Metamask can export that key, which will be required to redeem your KOIN when Koinos mainnet launches.

Finally, before mining, you will need to fund the miner. You can view the address of the key generated on the miner by clicking `Keys` again. We recommend funding the miner with minimal ETH as it is needed to mine.

The miner estimates how many proofs you can mine before running out so you can keep the miner topped off.

## Mining Behavior

Mining KOIN is a bit different than mining other cryptocurrencies. For starters, mining KOIN is separate from block production.

When mining for block production, you are only rewarded when you mine a block. There is a high amount of variance on the individual level, which mining pools help normalize.

Koinos mining does not support mining pools because it does not need mining pools to normalize variance. Because valid proofs do not generate blocks, there is no need to enforce a global total ordering on proofs, only a per address ordering. Each proof has a specified difficulty that determines how many hashes you are credited with when the proof is submitted. This is calculated as `(2^256 - 1) / difficulty` which is the expected number of hashes required to get a proof less than the difficulty.

It is useful to think in terms of proof frequency (i.e. how often do you want to submit a proof and "cash in" on your hashes). This is done by setting the proof frequency in the top bar. If you want to submit a proof every hour, then you would select 24 proofs per day. The miner monitors your system's hash rate and dynamically chooses a difficulty that targets your desired proof frequency.

The more often you submit proofs, the less variance you will have in terms of mining rewards. But there is a trade off. Each proof costs ETH in the form of gas costs. And each proof has the same cost regardless of how often you submit them. For example, submitting one proof every hours costs 24 times as much as submitting one proof a day, but will be creditted with the same number of hashes because the difficulty for the longer frequency will be 24x more difficult. However, the proof frequency is not a guarantee, but an average over time. If you are mining for weeks on end, then lower frequencies may be sufficient, but if you only plan on mining for a short time, a higher frequency may be advantageous. Our recommendation is somewhere between 1 and 24 proofs per day (one proof per hour vs one proof per day) assuming you are interested in mining more long term. Ultimately it a question for to determine how efficiently you want to use your ETH on mining.

Proof rewards are handled via an internal market maker that exchanges hashes for KOIN. Each proof submitted will mint KOIN in to the market maker at a predetermined diminishing rate. Over the course of 6 months, 100,000,000 KOIN will be minted. You are creditted with hashes based on your proof's difficulty and buy KOIN with those hashes from the market maker. In this way, we do not need to track a global difficulty for proofs as is needed in block production. Rather each proof is worth a different amount of KOIN depending on the current print rate and demand for KOIN via mining competition.

## Koinos Airdrop

After the mining period, what next? Koinos is a new blockchain and KOIN currently exists as an ERC-20 on Ethereum.

Prior to launching Koinos, we will announce a snapshot time. The ERC-20 contract we are using supports creating a snapshot of all KOIN balances. To redeem your KOIN on Koinos, you will need to sign a transaction on Koinos using the Ethereum private key associated with the address holding the KOIN. We will provide simple tooling to generate and submit this transaction, but bear the requirements in mind when deciding which address(es) to hold your KOIN prior to the snapshot date.

We encourage you to sign up to the Koinos mailing list on [https://koinos.io/](Koinos.io). We will be using this mailing list as the primary form of communication with KOIN holders prior to the snapshot, launch of Koinos, and airdrop.
