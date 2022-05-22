
import { useState, useEffect } from 'react';

import Nav from '../../components/nav';

import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';

import Web3 from "web3";

import hiveABI from '../../abi/hive.json';

let web3;

export default function Setup() {

    let [beneficiaries, setBeneficiaries] = useState({'0': ["", ""]});
    let [interval, setInterval] = useState(3600);
    let [tokens, setTokens] = useState({});
    let [step, setStep] = useState('beneficiaries');
    
    let [deploying, setDeploying] = useState(false);
    let [connected, setConnected] = useState(false);

    const steps = ["beneficiaries", "interval", "tokens", "summary"];

    useEffect(() => {
    }, [beneficiaries, interval, tokens]);

    const _continue = () => {
        let current = steps.indexOf(step);
        if (current + 1 >= steps.length) {
            deploy();
        }
        setStep(steps[current + 1]);
    };

    const _back = () => {
        let current = steps.indexOf(step);
        if (current - 1 < 0) {
            return;
        }
        setStep(steps[current - 1]);
    }

    const initWeb3 = () => {
        if (!window.ethereum) {
            return false;
        }

        window.web3 = new Web3(window.ethereum);
        return window.web3;
    }
    
    const onConnect = async () => {
        web3 = initWeb3();
        setConnected(true);
    }

    const deploy = async () => {
        setDeploying(true);
        const testnetAddr = "0xaB277639104116d672ED6E10aC03d9ca2678A8E6";
        let hive = new web3.eth.Contract(hiveABI, testnetAddr);

        let bens = [];
        for (let k in beneficiaries) {
            bens.push(beneficiaries[k][1]);
        }

        let intervalSecs = interval * 24 * 3600;
        let account = (await web3.eth.getAccounts())[0];

        try {
            await hive.methods.deploy(bens, account, intervalSecs).send({
                from: account,
                gas: 3000000,
            });
        } catch (err) {
            console.error(err);
            alert(err);
            return;
        }

        
    };

    return (
        <>
            <Nav
                onConnect={onConnect}
            />
            <Container>
                <form>
                    { step === 'beneficiaries' ? (
                    <div className="form-group">
                        <label>Beneficiaries</label>
                        <Beneficiaries
                            set={setBeneficiaries}
                            initialState={beneficiaries}
                        />
                    </div>
                    ) : ''}

                    { step === 'interval' ? (
                    <div className="form-group">
                        <Interval
                            set={setInterval}
                            initialState={interval}
                        />
                    </div>
                    ) : ''}

                    { step === 'tokens' ? (
                    <div className="form-group">
                        <TokenSelector 
                            set={setTokens}
                            initialState={tokens}
                        />
                    </div>
                    ) : ''}

                    { step === 'summary' ? (
                    <div className="form-group">
                        <Summary 
                            tokens={tokens}
                            beneficiaries={beneficiaries}
                            interval={interval}
                        />
                    </div>
                    ) : ''}

                    { deploying ? (
                    <div className="form-group">
                        <Col md={12} className="bg-col-1 p-5">
                            <h1 className="text-center">Deploying Contract</h1>
                            <p className="text-center">Confirm the transaction in your wallet</p>
                            
                            <Row className="p-1 justify-content-center">

                            </Row>
                        </Col>
                    </div>
                    ) : ''}

                    <Col md={12} className="text-center pad-top">
                        { !deploying ? (
                            <>          
                            { steps.indexOf(step) === 0 ? '' : (
                            <Button 
                                variant="light"
                                onClick={_back}
                            >
                                <span>Back</span>
                            </Button>
                            )}
                            <Button 
                                variant="primary"
                                onClick={_continue}
                            >
                                <span> { steps.indexOf(step) === (steps.length - 1) ? 'Create your Hive' : 'Continue'}</span>
                            </Button>
                            </>
                        ) : ''}
                    </Col>
                </form>
            </Container>
        </>
    );
};

function Summary({ tokens, interval, beneficiaries}) {

    let [benefs, setBens] = useState([]);
    let [toks, setToks] = useState([]);

    useEffect(() => {
        refreshBen(beneficiaries);
        refreshTok(tokens);
    }, [tokens, interval, beneficiaries])

    const refreshTok = (tokens) => {
        let toks = [];
        for (let token in tokens) {
            let active = tokens[token]
            if (!active) {
                continue;
            }

            token = token.toUpperCase();
            toks.push(TokenCol({ token }));
        }
        setToks(toks);
    };

    const refreshBen = (beneficiaries) => {
        let benefs = [];
        for (let k in beneficiaries) {
            let ben = beneficiaries[k]
            benefs.push(BenRow({ ben }))
        }
        setBens(benefs);
    };

    const BenRow = ({ben}) => (
        <Row key={ben[1]}>
            <Col>{ ben[0] }</Col>
            <Col>{ ben[1] }</Col>
        </Row>
    );

    const TokenCol = ({ token }) => (
        <Col key={token}>{ token }</Col>
    );

    return (
        <Col md={12} className="bg-col-1 p-5">
            <h1 className="text-center">Release the Honey to your Hives</h1>
            <p className="text-center">In summary....</p>
            
            <Row className="p-1 justify-content-center">

                <Col md={12} className="bg-shade p-4">
                    <Container>
                        <h4>Releasing to:</h4>
                        { benefs }
                    </Container>
                </Col>
                
                <Col md={12} className="bg-shade p-4 mar-top">
                    <Container>
                        <Row>
                            <h4>After bee not accessing wallet for:</h4>
                            <Col>{ interval } days</Col>
                        </Row>
                    </Container>
                </Col>

                <Col md={12} className="bg-shade p-4 mar-top">
                    <Container>
                        <Row>
                            <h4>Claimable Honey Tokens:</h4>
                            { toks }
                        </Row>
                    </Container>
                </Col>
            </Row>
        </Col>
    );
}

function TokenSelector({ set, initialState }) {

    let [toggled, setToggled] = useState({});

    useEffect(() => {
        setToggled(initialState)
    }, [])

    const toggleToken = (token) => {
        let n = {...toggled }
        let isActive = !!toggled[token];
        n[token] = !isActive;
        setToggled(n);
        set(n);
    }

    return (
        <div className="bg-col-1 p-5">
            <h1 className="text-center">Choose your Honey tokens</h1>
            <p className="text-center">Approve the tokens you wish to be claimable by your Hive addresses</p>

            <Row className="p-1 justify-content-center">
                <Col sm={4}>
                    <div className={"token-select " + (toggled.usdt ? "selected" : '')} id="usdt" onClick={() => toggleToken("usdt")}>
                        <img src="/usdt.png" alt="usdt"/>
                        <p>USDT</p>
                    </div>
                </Col>
                <Col sm={4}>
                    <div className={"token-select " + (toggled.usdc ? "selected" : '')} id="usdc" onClick={() => toggleToken("usdc")}>
                        <img src="/usdc.png" alt="usdc" />
                        <p>USDC</p>
                    </div>
                </Col>
                <Col sm={4}>
                    <div className={"token-select " + (toggled.btc ? "selected" : '')} id="btc" onClick={() => toggleToken("btc")}>
                        <img src="btc.png" alt="btc"/>
                        <p>BTC</p>
                    </div>
                </Col>
                <Col sm={4}>
                    <div className={"token-select " + (toggled.eth ? "selected" : '')} id="eth" onClick={() => toggleToken("eth")}>
                        <img src="eth.png" alt="eth"/>
                        <p>ETH</p>
                    </div>
                </Col>
                <Col sm={4}>
                    <div className={"token-select " + (toggled.bnb ? "selected" : '')} id="bnb" onClick={() => toggleToken("bnb")}>
                        <img src="bnb.png" alt="bnb"/>
                        <p>BNB</p>
                    </div>
                </Col>
                <Col sm={4}>
                    <div className={"token-select " + (toggled.busd ? "selected" : '')} id="busd" onClick={() => toggleToken("busd")}>
                        <img src="busd.png" alt="busd"/>
                        <p>BUSD</p>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

function Interval({ set , initialState}) {
    let [value, setValue] = useState('');

    useEffect(() => {
        setValue(initialState)
    }, [])

    const handleChange = (ev) => {
        ev.preventDefault();
        setValue(ev.target.value);
        set(ev.target.value);
    }

    return (
        <Col md={12} className="bg-col-1 p-5">
        
            <h1 className="text-center">Nectar Routine</h1>
            <p className="text-center">Set the max days that can pass since the last time you proved to have access to this wallet.</p>
            
            <Row className="p-1 justify-content-center text-center">
                
                <Col md={6}>
                    <input type="text" className="form-control" onChange={handleChange} value={value} placeholder="365"/>
                </Col>
            </Row>
        </Col>
    );
}

function Beneficiaries({ set, initialState }) {

    let [beneficiaries, setBeneficiaries] = useState({"0": ["", ""]});
    let [inputs, setInputs] = useState([]);

    useEffect(() => {
        setBeneficiaries(initialState)
    }, [])

    useEffect(() => {
        const handleChange = (val, i) => {
            let benefs = {...beneficiaries, [i]: val };
            setBeneficiaries(benefs);
        };

        const refreshInputs = (beneficiaries) => {
            let _inputs = [];
            for (let k in beneficiaries) {
                _inputs.push(BeneficiaryInput({
                    value: beneficiaries[k],
                    setValue: handleChange,
                    id: k,
                }))
            }
            setInputs(_inputs);
        };

        refreshInputs(beneficiaries);
        set(beneficiaries);
    }, [beneficiaries]);

    const addInput = () => {
        setBeneficiaries({ ...beneficiaries, [Object.keys(beneficiaries).length]: ["", ""]});
    }

    return (
        <div className="bg-col-1 p-5">
            <h1 className="text-center">Hive access</h1>
            <p className="text-center">Input one or more addresses that will have access to all your tokens in the future.</p>

            { inputs }

            <div className="form-group">
                <Button 
                    variant="success"
                    onClick={addInput}
                >
                    <span>Add Another</span>
                </Button>
            </div>
        </div>
    );
}

function BeneficiaryInput({ value, setValue, id }) {
    const handleChange = (ev, idx) => {
        ev.preventDefault();
        let val = value;
        if (!val || val === '') {
            val = ["", ""];
        }
        val[idx] = ev.target.value;
        setValue(val, id);
    }

    return (
        <Row className="form-group" id={`beneficiary-group-${id}`} key={`beneficiary-group-${id}`}>
            <div class="col-6">
                <input type="text" class="form-control" id="Nickname" placeholder="Bee Nickname" value={value[0]} onChange={(ev) => handleChange(ev, 0)} />
                <div id="nicknameHelp" class="form-text">Add a nickname to help you remember who this address belongs to.</div>
            </div>
            
            <div class="col-6">
                <input type="text" class="form-control" id="Address" placeholder="Bee Address: 0x0000...." value={value[1]} onChange={(ev) => handleChange(ev, 1)} />
                <div id="emailHelp" class="form-text">Address of the bee you want to have as a beneficiary.</div>
            </div>
        </Row>
    );
}