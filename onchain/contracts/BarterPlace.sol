// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "hardhat/console.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";
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
        ERC20,
        ERC1155
    }

    struct BarterAsset {
        address contractAddress;
        uint256 tokenId;
        BarterAssetType assetType;
        uint256 amount;
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
            } else if (assets[i].assetType == BarterAssetType.ERC20) {
                IERC20 erc20Contract = IERC20(assets[i].contractAddress);
                erc20Contract.transferFrom(from, to, assets[i].amount);
            } else if (assets[i].assetType == BarterAssetType.ERC1155) {
                IERC1155 erc1155Contract = IERC1155(assets[i].contractAddress);
                erc1155Contract.safeTransferFrom(from, to, assets[i].tokenId, assets[i].amount, "");
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
                    'Not an owner of ERC721'
                );
                require(
                    erc721Contract.isApprovedForAll(owner, address(this)),
                    'Missing approval for ERC721'
                );
            } else if (assets[i].assetType == BarterAssetType.ERC20) {
                IERC20 erc20Contract = IERC20(assets[i].contractAddress);
                require(
                    erc20Contract.allowance(owner, address(this)) >= assets[i].amount,
                    'Not enough allowance for ERC20'
                );
            } else if (assets[i].assetType == BarterAssetType.ERC1155) {
                IERC1155 erc1155Contract = IERC1155(assets[i].contractAddress);
                require(
                    erc1155Contract.balanceOf(owner, assets[i].tokenId) >= assets[i].amount,
                    'Insufficient ERC1155 balance'
                );
                require(
                    erc1155Contract.isApprovedForAll(owner, address(this)),
                    'Missing approval for ECR1155'
                );
            }
        }
    }

    function validateOffer (uint256 offerId) public view returns (bool) {

    }
}