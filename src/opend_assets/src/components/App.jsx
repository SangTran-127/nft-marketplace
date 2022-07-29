import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "bootstrap/dist/css/bootstrap.min.css";

import Minter from "./Minter"
import Item from "./Item";
function App() {

  return (
    <div className="App">
      <Header />
      {/* <Item id={nftID} /> */}

      {/* <Minter /> */}
      <Footer />
    </div>
  );
}

export default App;
