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
    
	it('Offer deadline', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const currentTimestamp = Math.round(new Date().getTime() / 1000)
		const deadline0 = currentTimestamp - 1
		const result = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets,
			deadline0,
		)).wait()

		const offerId = result.events[0].args.offerId
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('Offer expired') !== -1).to.be.true
		}
		
		// assuming this test can be completed in a minute
		const deadline1 = currentTimestamp + 60
		const result1 = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets,
			deadline1,
		)).wait()
        
		const offerId1 = result1.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId1)).wait()
		expect(await NFT1Contract.ownerOf(side0Assets[0].tokenId)).to.be.eq(side1.address)
	})

	it('Get recent offer id', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(owner, barterContract.address, NFT1Contract)
        
		await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets,
			0,
		)).wait()
        
		const recentOfferId0 = await barterContract.getRecentOfferId()
		expect(recentOfferId0).to.be.eq(0)
        
		await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets, 0
		)).wait()
		const recentOfferId1 = await barterContract.getRecentOfferId()
		expect(recentOfferId1).to.be.eq(1)

		await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets, 0
		)).wait()
		const recentOfferId2 = await barterContract.getRecentOfferId()
		expect(recentOfferId2).to.be.eq(2)
        
		const offerIdsSide0 = await barterContract.getOffersIdsByAddress(side0.address)
		expect(offerIdsSide0.length).to.be.eq(3)
		const offerIdsSide1 = await barterContract.getOffersIdsByAddress(side1.address)
		expect(offerIdsSide1.length).to.be.eq(3)
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
			side1Assets, 0
		)).wait()

		const side0Assets3 = await mintNFT(NFT1Contract, side0.address, 4)
		const side2Assets = await mintNFT(NFT1Contract, side2.address, 6)

		await (await barterContract.createOffer(
			side2.address,
			side0Assets3,
			side2Assets, 0
		)).wait()

		const side0Assets2 = side0Assets.slice(0, -1)
		const side1Assets2 = side1Assets.slice(0, -1)
		await (await barterContract.createOffer(
			side1.address,
			side0Assets2,
			side1Assets2, 0
		)).wait()

		
		const offersIdsSide0 = await barterContract.getOffersIdsByAddress(side0.address)
		const side0Offers = await barterContract.connect(side0).getOffersByIds(offersIdsSide0)
		expect(side0Offers.length).to.be.equal(3)
		expect(side0Offers[0].side0Assets.length).to.be.eq(2)
		expect(side0Offers[1].side0Assets.length).to.be.eq(4)
		expect(side0Offers[2].side0Assets.length).to.be.eq(1)
		expect(side0Offers[0].side1Assets.length).to.be.eq(2)
		expect(side0Offers[1].side1Assets.length).to.be.eq(6)
		expect(side0Offers[2].side1Assets.length).to.be.eq(1)

		const offersIdsSide1 = await barterContract.getOffersIdsByAddress(side1.address)
		const side1Offers = await barterContract.connect(side1).getOffersByIds(offersIdsSide1)
		expect(side1Offers.length).to.be.equal(2)
		expect(side1Offers[0].side0Assets.length).to.be.eq(2)
		expect(side1Offers[1].side0Assets.length).to.be.eq(1)
		expect(side1Offers[0].side1Assets.length).to.be.eq(2)
		expect(side1Offers[1].side1Assets.length).to.be.eq(1)

		const offersIdsSide2 = await barterContract.getOffersIdsByAddress(side2.address)
		const side2Offers = await barterContract.connect(side2).getOffersByIds(offersIdsSide2)
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
			side1Assets, 0
		)).wait()

        expect(result.events.length).to.be.equal(1)

		const event =result.events[0]
		expect(event.event).to.be.equal('OfferCreated')
		expect(event.args.side0).to.be.equal(side0.address)
		expect(event.args.side1).to.be.equal(side1.address)

		const side0Offers = await barterContract.connect(side0).getOffersByAddress(side0.address)
		expect(side0Offers.length).to.be.equal(1)
		const side0Offer = side0Offers[0]

		const side1Offers = await barterContract.connect(side1).getOffersByAddress(side1.address)
		expect(side1Offers.length).to.be.equal(1)
		const side1Offer = side0Offers[0]

		expect(side0Offer).to.be.deep.equal(side1Offer)
	});

	it("Check offer fee", async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)
		
		const offerFee = 100000
		await (await barterContract.setCreateOfferFee(offerFee)).wait()

        try {
			await (await barterContract.createOffer(
				side1.address,
				side0Assets,
				side1Assets, 0
			)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e).to.be.ok
		}
		
		const offerFeeFromContract = await barterContract.createOfferFee()
		expect(offerFeeFromContract).to.be.eq(offerFee)

		const result = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets, 0, { value: offerFee }
		)).wait()
		expect(result).to.be.ok
        
		const result2 = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets, 0, { value: offerFee }
		)).wait()
		expect(result2).to.be.ok
        
		const balance = await barterContract.provider.getBalance(barterContract.address)
        expect(balance).to.be.eq(offerFee * 2)
        
		const balanceBefore = await barterContract.provider.getBalance(side1.address)
		await (await barterContract.withdrawBalance(side1.address)).wait()
		const balanceAfter = await barterContract.provider.getBalance(side1.address)
		expect(balanceAfter).to.be.eq(balanceBefore.add(offerFee * 2))

		await (await barterContract.setAcceptOfferFee(offerFee)).wait()
		const offerAcceptFee = await barterContract.acceptOfferFee()
		expect(offerAcceptFee).to.be.eq(offerFee)

		const offerId = result.events[0].args.offerId
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('Invalid accept offer fee amount') !== -1).to.be.true
		}
		
		const acceptResult = await (await barterContract.connect(side1).acceptOffer(offerId, { value: offerFee })).wait()
		const acceptEvent = acceptResult.events[acceptResult.events.length - 1]
		
		expect(acceptEvent.args.side0).to.be.eq(side0.address)
		expect(acceptEvent.args.side1).to.be.eq(side1.address)

		expect(await NFT1Contract.ownerOf(side1Assets[0].tokenId)).to.be.eq(side0.address)
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
			side1Assets, 0
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

	it('Open offer (side1 = 0x0)', async () => {
		let side0 = signers[0]
		let side1 = signers[1]
		let side2 = signers[2]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			ethers.constants.AddressZero,
			side0Assets,
			side1Assets, 0
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

		const results1 = await (await barterContract.createOffer(
			ethers.constants.AddressZero,
			side1Assets,
			[], 0
		)).wait()
		const offerId1 = results1.events[0].args.offerId
		await (await barterContract.connect(side2).acceptOffer(offerId1)).wait()
		for (const asset of side1Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side2.address)
		}

		const erc20amount = 10000000
		const side1Erc20Assets = [await mintERC20(erc202Contract, side1.address, erc20amount)]
		await mintERC20(erc202Contract, side0.address, erc20amount)
		const results2 = await (await barterContract.connect(side2).createOffer(
			ethers.constants.AddressZero,
			side1Assets,
			side1Erc20Assets, 0
		)).wait()
		const offerId2 = results2.events[0].args.offerId
		await approveNFTS(side2, barterContract.address, NFT1Contract)
		await approveERC20(erc202Contract, side1, barterContract, erc20amount)
		await approveERC20(erc202Contract, side0, barterContract, erc20amount) // can use this
		await (await barterContract.connect(side0).acceptOffer(offerId2)).wait()
        try {
			await (await barterContract.connect(side1).acceptOffer(offerId2)).wait()
            expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('Offer status is not pending (canceled or fulfilled)') !== -1).to.be.true
		}
	})

	it('Wrong side1 address', async () => {
		let side0 = signers[0]
		let side1 = signers[1]
		let side2 = signers[2]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side2.address,
			side0Assets,
			side1Assets, 0
		)).wait()

		const offerId = results.events[0].args.offerId
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('Sender is not offer participant') !== -1).to.be.true
		}
		try {
			await (await barterContract.connect(side2).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('ERC721: transfer of token that is not own') !== -1).to.be.true
		}
	})
    
	it('Wrong side0 assets', async () => {
		let side0 = signers[0]
		let side1 = signers[1]
		let side2 = signers[2]

		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		const side2Assets = await mintNFT(NFT1Contract, side2.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)
		await approveNFTS(side2, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side2Assets,
			side1Assets, 0
		)).wait()

		const offerId = results.events[0].args.offerId
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('ERC721: transfer of token that is not own') !== -1).to.be.true
		}
	})
    
	it('Missing approvals', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			side1Assets, 0
		)).wait()
		const offerId = results.events[0].args.offerId
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('ERC721: transfer caller is not owner nor approved') != 1).to.be.true
		}

		await approveNFTS(side0, barterContract.address, NFT1Contract)
        
		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
		} catch (e) {
			expect(e.message.indexOf('ERC721: transfer caller is not owner nor approved') != 1).to.be.true
		}
		await approveNFTS(side1, barterContract.address, NFT1Contract)
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
		expect(await NFT1Contract.ownerOf(side0Assets[0].tokenId)).to.be.eq(side1.address)
	})

	it('Accept Empty Sides', async () => {
		let side0 = signers[0]
		let side1 = signers[1]

		const side0Assets = await mintNFT(NFT1Contract, side0.address, 2)
		const side1Assets = await mintNFT(NFT1Contract, side1.address, 2)
		await approveNFTS(side0, barterContract.address, NFT1Contract)
		await approveNFTS(side1, barterContract.address, NFT1Contract)

		const results = await (await barterContract.createOffer(
			side1.address,
			side0Assets,
			[], 0
		)).wait()

		const offerId = results.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		for (const asset of side0Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side1.address)
		}
		for (const asset of side1Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side1.address)
		}
		
		const results2 = await (await barterContract.createOffer(
			side1.address,
			[],
			side0Assets.concat(side1Assets), 0
		)).wait()

		const offerId2 = results2.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId2)).wait()

		for (const asset of side0Assets) {
			expect(await NFT1Contract.ownerOf(asset.tokenId)).to.be.eq(side0.address)
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
			side1Assets, 0
		)).wait()

		const offerId = results.events[0].args.offerId

        const cancelResults = await (await barterContract.cancelOffer(offerId)).wait()
		expect(cancelResults.events.length).be.eq(1)

		try {
			await (await barterContract.connect(side1).acceptOffer(offerId)).wait()
			expect(false).to.be.true
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
			side1Assets, 0
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
			side1Assets, 0
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
			side1Assets, 0
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
			side1Assets, 0
		)).wait()

		const offerId = results.events[0].args.offerId
		await (await barterContract.connect(side1).acceptOffer(offerId)).wait()

		for (const asset of side0Assets) {
			expect(await erc1155Contract.balanceOf(side1.address, asset.tokenId)).to.be.eq(amount)
		}
		for (const asset of side1Assets) {
			expect(await erc1155Contract.balanceOf(side0.address, asset.tokenId)).to.be.eq(amount)
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

// 0x side1 support
// wrong nfts side
// Test permissions
// Test open offers