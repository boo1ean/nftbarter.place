// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "hardhat/console.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BarterPlace is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _offerIdCounter;
    
    uint256 offerFee;
    
    enum OfferStatus {
        Pending,
        Canceled,
        Fulfilled
    }
    
    enum BarterAssetType {
        ERC721,
        ERC20
    }

    struct BarterAsset {
        address contractAddress;
        uint256 tokenId;
        BarterAssetType assetType;
    }
    
    struct BarterOffer {
        uint256 id;
        address side0;
        address side1;
        BarterAsset[] side0Assets;
        BarterAsset[] side1Assets;
        OfferStatus status;
    }
    
    mapping (uint256 => BarterOffer) offersById;
    mapping (address => uint256[]) offersByAddress;
    
    event OfferCreated(uint offerId, address side0, address side1);
    event OfferAccepted(uint offerId, address side0, address side1);
    event OfferCanceled(uint offerId, address side0, address side1);
    
    constructor () Ownable () {
        
    } 
    
    function setOfferFee (uint256 newOfferFee) public onlyOwner {
        offerFee = newOfferFee;
    }
    
    function withdrawBalance (address payable to) public payable onlyOwner {
        to.transfer(address(this).balance);
    }

    // Barter between side0 and side1 addresses
    // side0 - msg.sender
    // side1 - specified in call
    // Only side0 assets are validated while creating an offer
    // validation process will occur on acceptOffer call
    // Assets arrays must be sorted on client side so they keep exact order of elements
    // for ERC721 order by contractAddress, tokenId desc
    function createOffer (
        address side1,
        BarterAsset[] calldata side0Assets,
        BarterAsset[] calldata side1Assets) payable public {
        address side0 = msg.sender;

        require(msg.value >= offerFee, "Invalid create offer fee amount");
    
        uint256 offerId = _offerIdCounter.current();
        
        offersById[offerId].status = OfferStatus.Pending;
        offersById[offerId].id = offerId;
        offersById[offerId].side0 = side0;
        offersById[offerId].side1 = side1;
        
        for (uint256 i = 0; i < side0Assets.length; ++i) {
            offersById[offerId].side0Assets.push(side0Assets[i]);
        }
        for (uint256 i = 0; i < side1Assets.length; ++i) {
            offersById[offerId].side1Assets.push(side1Assets[i]);
        }
        
        offersByAddress[side0].push(offerId);
        offersByAddress[side1].push(offerId);
        
        _offerIdCounter.increment();
        
        emit OfferCreated(offerId, side0, side1);
    }
    
    function acceptOffer (uint256 offerId) public {
        BarterOffer storage offer = offersById[offerId];
        require(offer.side1 == msg.sender, 'Sender is not offer participant');
        require(offer.status == OfferStatus.Pending, 'Offer status is not pending (canceled or fulfilled)');
        
        _verifyOwnership(offer.side0, offer.side0Assets);
        _verifyOwnership(offer.side1, offer.side1Assets);
        
        _transferAssets(offer.side0, offer.side1, offer.side0Assets);
        _transferAssets(offer.side1, offer.side0, offer.side1Assets);
        
        offer.status = OfferStatus.Fulfilled;
        emit OfferAccepted(offer.id, offer.side0, offer.side1);
    }
    
    function cancelOffer (uint256 offerId) public {
        BarterOffer storage offer = offersById[offerId];
        require(offer.side0 == msg.sender, 'Sender is not offer initiator');
        require(offer.status == OfferStatus.Pending, 'Offer status is not pending (canceled or fulfilled)');

        offer.status = OfferStatus.Canceled;
        emit OfferCanceled(offer.id, offer.side0, offer.side1);
    }

    function _transferAssets(address from, address to, BarterAsset[] storage assets) internal {
        for (uint256 i = 0; i < assets.length; ++i) {
            if (assets[i].assetType == BarterAssetType.ERC721) {
                IERC721 erc721Contract = IERC721(assets[i].contractAddress);
                erc721Contract.safeTransferFrom(from, to, assets[i].tokenId);
            }
        }
    }
    
    function getOffers () public view returns (BarterOffer[] memory) {
        uint256[] memory offersIds = offersByAddress[msg.sender];
        BarterOffer[] memory offers = new BarterOffer[](offersIds.length);
        for (uint256 i = 0; i < offersIds.length; ++i) {
            offers[i] = offersById[i];
        }
        return offers;
    }
    
    function _verifyOwnership (address owner, BarterAsset[] storage assets) internal {
        for (uint256 i = 0; i < assets.length; ++i) {
            if (assets[i].assetType == BarterAssetType.ERC721) {
                IERC721 erc721Contract = IERC721(assets[i].contractAddress);
                require(
                    erc721Contract.ownerOf(assets[i].tokenId) == owner,
                    'Not an owner of NFT'
                );
                require(
                    erc721Contract.isApprovedForAll(owner, address(this)),
                    'Missing approval for NFT'
                );
            }
        }
    }

    function validateOffer (uint256 offerId) public view returns (bool) {

    }
}