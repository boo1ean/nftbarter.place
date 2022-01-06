const { expect } = require("chai")
const { ethers } = require("hardhat")


describe("Bartering", () => {
    let NFT1Contract
	let NFT2Contract
	let erc201Contract
	let erc202Contract
	let erc1155Contract
    let barterContract
    let signers
	let owner

	beforeEach(async () => {
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

		const ERC1155 = await ethers.getContractFactory('NFT1155')
		erc1155Contract = await ERC1155.deploy()
		await erc1155Contract.deployed()

		const BarterPlace = await ethers.getContractFactory('BarterPlace')
		barterContract = await BarterPlace.deploy()
		await barterContract.deployed()


		signers = await ethers.getSigners()
		owner = signers[0]
	})

	it('Get Multiple offers', async () => {
		let side0 = signers[0]
		let side1 = signers[1]
		let side2 = signers[2]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(owner, barterContract.address, NFT1Contract)

		await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const side0Assets3 = await mintNFT(NFT1Contract, side0.address, 4)
		const side2Assets = await mintNFT(NFT1Contract, side2.address, 6)

		await (await barterContract.createOffer(
			side2.address,
			side0Assets3,
			side2Assets,
		)).wait()

		const side0Assets2 = side0Assets.slice(0, -1)
		const side1Assets2 = side1Assets.slice(0, -1)
		await (await barterContract.createOffer(
			side1.address,
			side0Assets2,
			side1Assets2
		)).wait()

		const side0Offers = await barterContract.connect(side0).getOffers()
		expect(side0Offers.length).to.be.equal(3)
		expect(side0Offers[0].side0Assets.length).to.be.eq(2)
		expect(side0Offers[1].side0Assets.length).to.be.eq(4)
		expect(side0Offers[2].side0Assets.length).to.be.eq(1)
		expect(side0Offers[0].side1Assets.length).to.be.eq(2)
		expect(side0Offers[1].side1Assets.length).to.be.eq(6)
		expect(side0Offers[2].side1Assets.length).to.be.eq(1)

		const side1Offers = await barterContract.connect(side1).getOffers()
		expect(side1Offers.length).to.be.equal(2)
		expect(side1Offers[0].side0Assets.length).to.be.eq(2)
		expect(side1Offers[1].side0Assets.length).to.be.eq(1)
		expect(side1Offers[0].side1Assets.length).to.be.eq(2)
		expect(side1Offers[1].side1Assets.length).to.be.eq(1)

		const side2Offers = await barterContract.connect(side2).getOffers()
		expect(side2Offers.length).to.be.equal(1)
		expect(side2Offers[0].side0Assets.length).to.be.eq(4)
		expect(side2Offers[0].side1Assets.length).to.be.eq(6)
		for (const asset in side2Offers[0].side0Assets) {
			expect(side2Offers[0].side0Assets[asset].tokenId).to.be.eq(side0Assets3[asset].tokenId)
		}
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

	it('ERC20 swaps', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 10000
		const side0Assets = [await mintERC20(erc201Contract, side0.address, amount)]
		const side1Assets = [await mintERC20(erc202Contract, side1.address, amount)]

		await approveERC20(erc201Contract, side0, barterContract, amount)
		await approveERC20(erc202Contract, side1, barterContract, amount)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		expect(await erc201Contract.balanceOf(side1.address)).to.be.equal(amount)
		expect(await erc201Contract.balanceOf(side0.address)).to.be.equal(0)

		expect(await erc202Contract.balanceOf(side0.address)).to.be.equal(amount)
		expect(await erc202Contract.balanceOf(side1.address)).to.be.equal(0)
	})

	it('NFT to ERC20', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 10000
		const side0Assets = [await mintERC20(erc201Contract, side0.address, amount)]
		await approveERC20(erc201Contract, side0, barterContract, amount)

		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		expect(await erc201Contract.balanceOf(side1.address)).to.be.equal(amount)
		expect(await erc201Contract.balanceOf(side0.address)).to.be.equal(0)

		for (const asset of side1Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side0.address)
		}
	})

	it('ERC20 to NFT', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 10000
		const side1Assets = [await mintERC20(erc201Contract, side1.address, amount)]
		await approveERC20(erc201Contract, side1, barterContract, amount)

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		expect(await erc201Contract.balanceOf(side0.address)).to.be.equal(amount)
		expect(await erc201Contract.balanceOf(side1.address)).to.be.equal(0)

		for (const asset of side0Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side1.address)
		}
	})

	it('ERC1155 to ERC1155', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 3
		const side0Assets = await mintNFT1155(erc1155Contract, side0.address, 1, amount)
		const side1Assets = await mintNFT1155(erc1155Contract, side1.address, 2, amount)
		await approveNFTS1155(side0, barterContract.address, erc1155Contract)
		await approveNFTS1155(side1, barterContract.address, erc1155Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		const acceptResults = await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		for (const asset of side0Assets) {
			expect(await erc1155Contract.balanceOf(side1.address, asset.tokenId)).to.be.eq(amount)
		}
		for (const asset of side1Assets) {
			expect(await erc1155Contract.balanceOf(side0.address, asset.tokenId)).to.be.eq(amount)
		}
	})

/*
	it('Verify valid offer', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 3
		const side0Assets = await mintNFT1155(erc1155Contract, side0.address, 1, amount)
		const side1Assets = await mintNFT1155(erc1155Contract, side1.address, 2, amount)
		await approveNFTS1155(side0, barterContract.address, erc1155Contract)
		await approveNFTS1155(side1, barterContract.address, erc1155Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()
		const offerId = results.events[0].args.offerId
		const isValid = await barterContract.validateOffer(offerId)
		expect(isValid).to.be.true
	})

	it('Verify invalid offer side0 approval', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 3
		const side0Assets = await mintNFT1155(erc1155Contract, side0.address, 1, amount)
		const side1Assets = await mintNFT1155(erc1155Contract, side1.address, 2, amount)
		// await approveNFTS1155(side0, barterContract.address, erc1155Contract)
		await approveNFTS1155(side1, barterContract.address, erc1155Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()
		const offerId = results.events[0].args.offerId
		try {
			const isValid = await barterContract.validateOffer(offerId)
			expect(false).to.be.true
		} catch (e) {
			expect(e).to.be.ok
		}
	})

	it('Verify invalid offer side1 approval', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 3
		const side0Assets = await mintNFT1155(erc1155Contract, side0.address, 1, amount)
		const side1Assets = await mintNFT1155(erc1155Contract, side1.address, 2, amount)
		await approveNFTS1155(side0, barterContract.address, erc1155Contract)
		//await approveNFTS1155(side1, barterContract.address, erc1155Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()
		const offerId = results.events[0].args.offerId
		try {
			const isValid = await barterContract.validateOffer(offerId)
			expect(false).to.be.true
		} catch (e) {
			expect(e).to.be.ok
		}
	})

	it('Verify invalid offer erc20 balance', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const amount = 10000
		const side1Assets = [await mintERC20(erc201Contract, side1.address, amount)]
		await approveERC20(erc201Contract, side1, barterContract, amount - 10)

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets
		)).wait()

		const offerId = results.events[0].args.offerId
		try {
			const isValid = await barterContract.validateOffer(offerId)
			expect(false).to.be.true
		} catch (e) {
			expect(e).to.be.ok
		}
	})
*/

	async function mintNFT (contract, to, count) {
    	const results = []
		for (let i = 0; i < count; ++i) {
			await (await contract.safeMint(to)).wait()
            const tokenId = await contract.getLastTokenId()
			results.push({
				contractAddress: contract.address,
				tokenId,
				assetType: 0,
				amount: 0,
			})
		}
		return results
	}

	async function mintNFT1155 (contract, to, id, amount) {
		const results = []
		await (await contract.mint(to, id, amount, [])).wait()
		results.push({
			contractAddress: contract.address,
			tokenId: id,
			assetType: 2,
			amount: amount,
		})
		return results
	}

	async function mintERC20 (contract, to, amount) {
		await contract.mint(to, amount)
		return {
			contractAddress: contract.address,
			tokenId: 0,
			assetType: 1,
			amount: amount,
		}
	}

	async function approveNFTS (owner, operator, contract) {
		await contract.connect(owner).setApprovalForAll(operator, true)
	}

	async function approveNFTS1155 (owner, operator, contract) {
		await contract.connect(owner).setApprovalForAll(operator, true)
	}

	async function approveERC20 (contract, owner, operator, amount) {
		await contract.connect(owner).approve(operator.address, amount);
	}
})

// set and check fee
// wrong fee
// wrong nfts side1
// missing approval side0
// missing approval side1
