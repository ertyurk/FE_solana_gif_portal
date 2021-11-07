import Image from 'next/image'
import { useEffect, useState } from 'react';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import idl from '../lib/idl.json'
import kp from '../keypair.json'

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;


// SystemProgram is a reference to the Solana runtime
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
//let baseAccount = Keypair.generate();
// in order to make it save bw cache for solana we use following
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Gey our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a transaction is done.
const opts = {
  preflightCommitment: 'processed'
}

let userWalletAddress;
let totalGifCount;

export default function Home() {
  // app state
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])



  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const res = await solana.connect({ onlyIfTrusted: true });
          console.log('Connected with Public Key:', res.publicKey.toString());
          userWalletAddress = res.publicKey.toString()
          // setting address to state
          setWalletAddress(res.publicKey.toString())

        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);


  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      totalGifCount = account.gifList.length;
      console.log("totalGifCount ", totalGifCount)


      console.log("got the account", account);
      setGifList(account.gifList);
    } catch (e) {
      console.log(`Error in get gifs: ${e}`);
      setGifList(null)
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching Gif list...");
      // call solana program
      // set state
      getGifList()
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const res = await solana.connect();
      console.log('Connected with Public Key:', res.publicKey.toString());
      setWalletAddress(res.publicKey.toString());
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      console.log('ping');
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })
      console.log(`Created a new BaseAccount w address: ${baseAccount.publicKey.toString()}`);
      await getGifList()
    } catch (e) {
      console.log(`Error creating BaseAccount: ${e}`);
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  const userStrip = () => {
    return (
      <div className="connected-profile">
        <div className="account-balance">
          {totalGifCount} 
          {totalGifCount == 0 ? " Gif" 
            : totalGifCount == 1 ? " Gif"
            : " Gifs"}
        </div>
        <div className="main-account">
          <div className="account-strip">
            {`${userWalletAddress.substring(0, 6)}...${userWalletAddress.substr(-6)}`}
          </div>
          <div className="logo">

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            {!walletAddress ? "Upload" : "View"} your GIF collection in the metaverse ✨
            {walletAddress && userStrip()}

          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <Image
            alt="Twitter Logo"
            className="twitter-logo"
            src="/twitter-logo.svg"
            width={35} height={35} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};





/*


*/