import Iter "mo:base/Iter";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import NFTActor "../nft/nft";
import Principal "mo:base/Principal";
import List "mo:base/List";
actor OpenD {

    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };

    var mapOfNFTs = HashMap.HashMap<Principal, NFTActor.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imageData: [Nat8], name: Text) : async Principal {
        let owner : Principal = msg.caller;
        Debug.print(debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000);
        let newNFT = await NFTActor.NFT(name, owner, imageData);
        Debug.print(debug_show(Cycles.balance()));
        let newNFTPrincipal = await newNFT.getCanisterID();
        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal); 
        return newNFTPrincipal;
    };

    private func addToOwnershipMap(owner: Principal, nftID: Principal) {
        var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)) {
             // empty List
            case null List.nil<Principal>();
            case (?result) result;
        };
        ownedNFTs := List.push(nftID, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    public query func getListedNFTs() : async [Principal] {
        let ids = Iter.toArray(mapOfListings.keys());
        return ids;
    };
    public query func getOwnedNFTs(user: Principal) : async [Principal] {
         let userNFTs : List.List<Principal> = switch (mapOfOwners.get(user)) {
             // empty List
            case null List.nil<Principal>();
            case (?result) result;
        };
        return List.toArray(userNFTs);
    };

    public shared(msg) func listItem(id: Principal, price: Nat) : async Text {
        var item : NFTActor.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };
        let owner = await item.getOwner();
        if (Principal.equal(owner, msg.caller)) {
            let newListing : Listing = {
                itemOwner = owner;
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "Success";
        } else {
            return "You dont own the NFT"
        }
    };
    public query func getOpenDCanisterID() : async Principal {
         return Principal.fromActor(OpenD);
    };

    public query func isListed(id: Principal) : async Bool {
        if (mapOfListings.get(id) == null) {
            return false;
        } else {
            return true;
        }
       
    };
    public query func getOriginalOwner(id: Principal) : async Principal {
      var listing : Listing = switch (mapOfListings.get(id)) {
        case null return Principal.fromText("");
        case (?result) result;
      };
    return listing.itemOwner;
    };


    public query func getListedNFTPrice(id: Principal) : async Nat {
        var listing : Listing = switch (mapOfListings.get(id)) {
        case null return 0;
        case (?result) result;
      };
    return listing.itemPrice;
    };
    public shared(msg) func completePurchase(id: Principal, ownerID: Principal, newOwnerID: Principal) : async Text {
        var purchasedNFT: NFTActor.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };
        let transferResult = await purchasedNFT.transferOwnership(newOwnerID);
        if (transferResult == "Success") {
            mapOfListings.delete(id);
            var ownedNFTs : List.List<Principal> = switch(mapOfOwners.get(ownerID)) {
                case null List.nil<Principal>();
                case (?result) result;
            };
            ownedNFTs := List.filter(ownedNFTs, func (listItemID : Principal) : Bool {
                return listItemID != id;
            });
            addToOwnershipMap(newOwnerID, id);
            return "Success";
        } else {
            return "Error";
        }
        
    };
}
