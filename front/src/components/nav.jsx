
import Connect from "./connect";
import Container from 'react-bootstrap/Container';

function Logo() {
    return (
        <p className="logo">
            <img alt="PlanBee Logo" src="/logo.png" />
        </p>
    )
}

function Nav({onConnect}) {
    return (
        <>
            <nav>
                <Container>
                    <div className="nav-brand">
                        <Logo/>
                    </div>
                    <div className="connect-btn">
                        <Connect
                            onConnect={onConnect}
                        />
                    </div>
                </Container>
            </nav>
        </>
    );
}


export default Nav;