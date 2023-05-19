/**
 * A simple object to pass to our database functions that represents the data
 *  our application cares about from the Plaid transaction endpoint
 */
class SimpleTransaction {
  constructor(
    id,
    userId,
    accountId,
    category,
    date,
    authorizedDate,
    name,
    amount,
    currencyCode,
    pendingTransactionId
  ) {
    this.id = id;
    this.userId = userId;
    this.accountId = accountId;
    this.category = category;
    this.date = date;
    this.authorizedDate = authorizedDate;
    this.name = name;
    this.amount = amount;
    this.currencyCode = currencyCode;
    this.pendingTransactionId = pendingTransactionId;
  }

  /**
   * Static factory method for creating the SimpleTransaction object
   *
   * @param {import("plaid").Transaction} txnObj The transaction object returned from the Plaid API
   * @param {string} userId The userID
   * @returns SimpleTransaction
   */
  static fromPlaidTransaction(txnObj, userId) {
    return new SimpleTransaction(
      txnObj.transaction_id,
      userId,
      txnObj.account_id,
      txnObj.personal_finance_category.primary,
      txnObj.date,
      txnObj.authorized_date,
      txnObj.merchant_name ?? txnObj.name,
      txnObj.amount,
      txnObj.iso_currency_code,
      txnObj.pending_transaction_id
    );
  }
}

module.exports = { SimpleTransaction };
