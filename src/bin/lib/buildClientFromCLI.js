import XCPDClient from '../../lib';

export default function buildXCPDClient() {
    let HOST         = process.env.HOST;
    let PORT         = process.env.PORT;
    let RPC_USERNAME = process.env.RPC_USERNAME;
    let RPC_PASSWORD = process.env.RPC_PASSWORD;

    let opts = {
        host:     HOST,
        port:     PORT,
        username: RPC_USERNAME,
        password: RPC_PASSWORD,
    }

    return XCPDClient.connect(opts);    
}

