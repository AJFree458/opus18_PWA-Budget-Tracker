function offlineSave(data) {
  const request = generateindexedDB();
  // Opens a transaction, accesses the toDoList objectStore and statusIndex.
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(["offlineTransactionDB"], "readwrite");
    const transactionStore = transaction.objectStore("offlineTransactionDB");
    const transactionIndex = transactionStore.index("transactionIndex");

    // Adds data to our objectStore
    transactionStore.add({ transID: data.date, status: "LocalStored", name: data.name, value: data.value });
   
    // Return an item by index
    const getRequestIdx = transactionIndex.getAll("LocalStored");
    getRequestIdx.onsuccess = () => {
      console.log(getRequestIdx.result); 
    }; 
  };
};

function sendSaveToDB() {
  const request = generateindexedDB();
  const db = request.result;
  // open a transaction on offlineTransaction db
  const transaction = db.transaction(["offlineTransaction"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("offlineTransaction");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["pending"], "readwrite");

        // access your pending object store
        const store = transaction.objectStore("pending");

        // clear all items in your store
        store.clear();
      });
    }
  };
};

function generateindexedDB() {
  // We request a database instance.
  const request = indexedDB.open("offlineTransactionDB", 1);
  
  // This returns a result that we can then manipulate.
  request.onsuccess = event => {
    const db = event.target.result;
    // Creates an object store with a listID keypath that can be used to query on.
    const transactionStore = db.createObjectStore("offlineTransactionDB", {keypath: "transID"});
    // Creates a transactionIndex that we can query on.
    transactionStore.createIndex("transactionIndex", "status");
    transactionStore.createIndex("name", "name");
    transactionStore.createIndex("value", "value");
  };
  return request
};
