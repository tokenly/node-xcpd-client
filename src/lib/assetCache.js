import levelup from 'levelup'
import leveldown from 'leveldown'

let cache = {}

cache.connect = (filepath)=>{
    let connection = {};

    let db = levelup(filepath, {
        valueEncoding: 'json'
    });

    connection.get = (assetName)=>{
        checkDb();
        return new Promise((resolve, reject)=>{
            db.get(assetName, function (err, value) {
                if (err && err.notFound) {
                    return resolve(null);
                }
                if (err) {
                    return reject(err);
                }

                resolve(value);
            });
        });
    }

    connection.isDivisible = (assetName)=>{
        return connection.get(assetName).then((info)=>{
            if (info == null) { return null; }

            return info.divisible;
        });
    }

    connection.put = (assetName, info)=>{
        checkDb();
        return new Promise((resolve, reject)=>{
            db.put(assetName, info, (err)=>{
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        })
    }

    connection.close = ()=>{
        return new Promise((resolve, reject)=>{
            db.close((err)=>{
                if (err) {
                    reject(err);
                }
                resolve();
            });
        })
    }



    function checkDb() {
        if (db == null) { throw new Error("asset cache db not initiallized"); }
    }

    return connection;
}

cache.destroy = (filepath)=>{
    return new Promise((resolve, reject)=>{
        leveldown.destroy(filepath, (err)=>{
            if (err) {
                return reject(err);
            }
            return resolve();
        })
    })
}



export default cache