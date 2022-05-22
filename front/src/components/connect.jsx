

import Button from 'react-bootstrap/Button';
import { useState } from 'react';

function Connect({ onConnect }) {

    let [connecting, setConnecting] = useState(false);
    let [connected, setConnected] = useState(false);
    let [addr, setAddr] = useState('');

    const handleConnect = async () => {
        setConnecting(true);
        let accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        setConnected(true);
        setAddr(accs[0])
        setConnecting(false);
        if (onConnect) {
            onConnect();
        }
    }

    const trimAddr = (addr) => {
        return addr.slice(0, 6) + ' .... ' + addr.slice(-6);
    }

    return (
        <Button variant="light" onClick={handleConnect} disabled={connecting}>
            <div className={ !connected ? "dot" : "dot connected"}></div>
            { !connected ? 'Connect Wallet' : trimAddr(addr) }
        </Button>
    );
}

export default Connect;