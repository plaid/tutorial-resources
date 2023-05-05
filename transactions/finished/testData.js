// Want to test out modified transactions? Copy this bit of code to the end
// of your fetchNewSyncData call

allData.modified.push({
  account_id: "USE_AN_EXISTING_ACCOUNT_ID",
  account_owner: null,
  amount: 6.33,
  authorized_date: "2021-03-23",
  authorized_datetime: null,
  category: ["Travel", "Taxi"],
  category_id: "22016000",
  check_number: null,
  date: "2021-03-24",
  datetime: null,
  iso_currency_code: "USD",
  location: {
    address: null,
    city: null,
    country: null,
    lat: null,
    lon: null,
    postal_code: null,
    region: null,
    store_number: null,
  },
  merchant_name: "Uber",
  name: "Uber 072515 SF**POOL**",
  payment_channel: "online",
  payment_meta: {
    by_order_of: null,
    payee: null,
    payer: null,
    payment_method: null,
    payment_processor: null,
    ppd_id: null,
    reason: null,
    reference_number: null,
  },
  pending: false,
  pending_transaction_id: null,
  personal_finance_category: {
    detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
    primary: "TRANSPORTATION",
  },
  transaction_code: null,
  transaction_id: "USE_AN_EXISTING_TRANSACTION_ID",
  transaction_type: "special",
  unofficial_currency_code: null,
});

// And here's some code you can use to test removed
// transactions

allData.removed.push({
  transaction_id: "USE_AN_EXISTING_TRANSACTION_ID",
});
