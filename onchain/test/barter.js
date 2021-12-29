const { expect } = require("chai")
const { ethers } = require("hardhat")


describe("Bartering", () => {
    let NFT1Contract
	let NFT2Contract
	let erc201Contract
	let erc202Contract
    let barterContract
    let signers
	let owner

	before(async () => {
		const ERC201 = await ethers.getContractFactory('ERC201')
		erc201Contract = await ERC201.deploy()
		await erc201Contract.deployed()

		const ERC202 = await ethers.getContractFactory('ERC202')
		erc202Contract = await ERC202.deploy()
		await erc202Contract.deployed()

		const NFT1 = await ethers.getContractFactory('NFT1')
		NFT1Contract = await NFT1.deploy()
		await NFT1Contract.deployed()

		const NFT2 = await ethers.getContractFactory('NFT2')
		NFT2Contract = await NFT2.deploy()
		await NFT2Contract.deployed()

		const BarterPlace = await ethers.getContractFactory('BarterPlace')
		barterContract = await BarterPlace.deploy()
		await barterContract.deployed()

		signers = await ethers.getSigners()
		owner = signers[0]
	})

	it("Create barter offer", async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
        const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(owner, barterContract.address, NFT1Contract)

		const result = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

        expect(result.events.length).to.be.equal(1)

		const event =result.events[0]
		expect(event.event).to.be.equal('OfferCreated')
		expect(event.args.side0).to.be.equal(side0.address)
		expect(event.args.side1).to.be.equal(side1.address)

		const side0Offers = await barterContract.connect(side0).getOffers()
		expect(side0Offers.length).to.be.equal(1)
		const side0Offer = side0Offers[0]

		const side1Offers = await barterContract.connect(side1).getOffers()
		expect(side1Offers.length).to.be.equal(1)
		const side1Offer = side0Offers[0]

		expect(side0Offer).to.be.deep.equal(side1Offer)
	});

    it('Accept barter offer', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		const acceptResults = await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		expect(acceptResults.events.length).be.eq(9)

		for (const asset of side0Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side1.address)
		}
		for (const asset of side1Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side0.address)
		}
	})

	it('Cancel offer', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId

        const cancelResults = await (await barterContract.cancelOffer(offerId)).wait()
		expect(cancelResults.events.length).be.eq(1)

		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(true).to.be.true
		} catch (e) {
			expect(e.message.indexOf('Offer status is not pending (canceled or fulfilled)') != 1).to.be.true
		}

		for (const asset of side0Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side0.address)
		}
		for (const asset of side1Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side1.address)
		}
	})

	async function mintNFT (contract, to, count) {
    	const results = []
		for (let i = 0; i < count; ++i) {
			await (await contract.safeMint(to)).wait()
            const tokenId = await contract.getLastTokenId()
			results.push({
				contractAddress: contract.address,
				tokenId,
				assetType: 0,
			})
		}
		return results
	}

	async function approveNFTS (owner, operator, contract) {
		await contract.connect(owner).setApprovalForAll(operator, true)
	}
})
