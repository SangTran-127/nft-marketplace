
import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent"
import { idlFactory } from "../../../declarations/nft"
import { idlFactory as tokenIdlFactory } from "../../../declarations/token"
import { Principal } from "@dfinity/principal"
import Button from "./Button"
import PriceLabel from "./PriceLabel"
import { opend } from "../../../declarations/opend"
import CURRENT_USER_ID from "../index";
function Item(props) {
  const [shouldDisplay, setShouldDisplay] = useState(true)
  const [priceLabel, setPriceLabel] = useState()
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState('');
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [image, setImage] = useState("");
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState()
  const { id } = props;
  const localHost = "http://localhost:8080/"
  const agent = new HttpAgent({
    host: localHost
  });
  // neu deploy len ic thi xoa dong agent nay
  agent.fetchRootKey();
  let nftActor;
  async function loadNFT() {
    nftActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id
    })
    const nftName = await nftActor.getName();
    setName(nftName)
    const nftOwner = await nftActor.getOwner();
    setOwner(nftOwner.toText())
    const nftImage = await nftActor.getAsset()
    const nftImageFormat = new Uint8Array(nftImage);
    const myImage = URL.createObjectURL(new Blob([nftImageFormat.buffer], {
      type: "image/png"
    }));
    setImage(myImage)
    if (props.role === "collection") {
      const nftIsListed = await opend.isListed(id);
      if (nftIsListed) {
        setOwner("SangNFT")
        setBlur({
          filter: "blur(4px)"
        });
        setSellStatus("Listed")
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"} />)
      }
    } else if (props.role === "discover") {
      const originalOwner = await opend.getOriginalOwner(id);
      if (originalOwner.toText() != CURRENT_USER_ID) {
        setButton(<Button handleClick={handleBuy} text={"Buy"} />)
      }
      const price = await opend.getListedNFTPrice(id);
      setPriceLabel(<PriceLabel price={price.toString()} />)
    }

  }

  useEffect(() => {
    loadNFT();
  }, [])
  let price
  function handleSell() {
    setPriceInput(
      <input
        placeholder="Price in SAC"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => (price = e.target.value)}
      />)
    setButton(<Button text={"Confirm"} handleClick={sellItem} />)
  }
  async function sellItem() {
    setLoaderHidden(false);
    setBlur({
      filter: "blur(4px)"
    });
    const listingResult = await opend.listItem(id, Number(price));
    console.log(listingResult);
    if (listingResult === "Success") {
      const openD_ID = await opend.getOpenDCanisterID();
      const transferResult = await nftActor.transferOwnership(openD_ID);
      console.log("transfer " + transferResult);
      if (transferResult === "Success") {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("SangNFT")
      }
    }
  }
  async function handleBuy() {
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("wflfh-4yaaa-aaaaa-aaata-cai")
    })
    const sellerID = await opend.getOriginalOwner(id)
    const itemPrice = await opend.getListedNFTPrice(id)

    const result = await tokenActor.transfer(sellerID, itemPrice)

    if (result == "Success") {
      const transferResult = await opend.completePurchase(id, sellerID, CURRENT_USER_ID)
      console.log(transferResult);
      setLoaderHidden(true)
      setShouldDisplay(false)
    }

  }
  return (
    <div style={{ display: shouldDisplay ? 'inline' : 'none' }} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            {owner}
          </p>

          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
